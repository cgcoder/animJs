function init() {
    var canvas = document.getElementById("canvas");
}

var context = {
    lastTime: null,
    timeElapsed: 0,
    frame: 0,
    id: 0,
}

var root = {
    children: [],
    beforeUpdate: function(context) {
        const toBeRemoved = [];
        this.children.forEach(c => {
            c.beforeUpdate?.(context);

            if (c.type === "animation" && c.state === "complete") {
                toBeRemoved.push(c);
                c.resolve();
            }
            else if (c.state === "unstaged") {
                console.log('removing ' + c.id);
                toBeRemoved.push(c);
            }
        });
        this.children = this.children.filter((c) => {
            const index = toBeRemoved.indexOf(c);
            return index < 0;
        });
    },
    update: function(context) {
        const ctx = context.canvasContext;
        ctx.clearRect(0, 0, context.canvas.width, context.canvas.height);
        ctx.lineWidth = 3;
        ctx.fillStyle = "rgb(112 205 200)";
        ctx.strokeStyle = "rgb(100 100 100)";
      
        this.children.forEach(c => c.update?.(context));
    },
    afterUpdate: function(context) {
        this.children.forEach(c => c.afterUpdate?.(context));
    },
    addChildren: function(c) {
        if (c.state == 'staged') return;
        c.state = 'staged';
        c.id = ++context.id;
        this.children.push(c);
    }
}

var animJs = {
    root: root,
    start: function() {
        context.canvas = document.getElementById("canvas");
        context.canvasContext = document.getElementById("canvas").getContext("2d");
        window.requestAnimationFrame(animJs.update);
    },
    update: function() {
        if (context.lastTime == null) {
            context.lastTime = new Date();
            window.requestAnimationFrame(animJs.update);
            return;
        }
        var currentTime = new Date();

        context.timeElapsed = currentTime.getTime() - context.lastTime.getTime();
        root.beforeUpdate(context);
        root.update(context);
        root.afterUpdate(context);
        window.requestAnimationFrame(animJs.update);
        context.frame++;
        context.lastTime = currentTime;
    },
    play: function(animation) {
        if (!animation.type === "animation" || !animation.object) {
            throw "Cannot play non-animation object. Must have type animation and object";
        }
        this.root.addChildren(animation);
        this.root.addChildren(animation.object);
        return new Promise((resolve, reject) => {
            animation.resolve = resolve;
            animation.reject = reject;
        });
    },
    wait: function(durationInMs) {
        return new Promise((resolve) => {
            setTimeout(resolve, durationInMs);
        });
    },
    add: function(obj) {
        this.root.addChildren(obj);
    }
}

function Circle(props) {
    var circle = {
        props: initCircleProps(props),
        type: "shape",
        update: function(context) {
            const cc = context.canvasContext;
            cc.save();
            cc.beginPath();
            cc.arc(this.props.x, this.props.y, this.props.radius, 0, this.props.endAngle, false); // Earth orbit
            cc.fill();
            cc.stroke();
            cc.restore();
        }
    };
    return circle;
}

function Rect(props) {
    var rect = {
        props: initRectProps(props),
        type: "shape",
        update: function(context) {
            const cc = context.canvasContext;
            cc.save();
            cc.translate(this.props.x + this.props.width/2, this.props.y+this.props.height/2);
            cc.rotate(this.props.rotation);
            cc.beginPath();
            cc.fillStyle = "cyan";
            cc.rect(-this.props.width/2, -this.props.height/2, this.props.width, this.props.height);
            cc.fill();
            cc.stroke();
            cc.restore();
        }
    };
    return rect;
}

function Arrow(props) {
    if (!props) props = {};

    var arrow = {
        props: initArrowProps(props),
        type: "shape",
        update: function(context) {
            console.log(this.props.fromX, this.props.fromY, this.props.toX, this.props.toY);
            const cc = context.canvasContext;
            cc.save();
            cc.beginPath();
            cc.moveTo(this.props.fromX, this.props.fromY);
            cc.lineTo(this.props.toX, this.props.toY);
            const headlen = 10; // length of head in pixels
            const angle = Math.atan2(this.props.toY - this.props.fromY, this.props.toX - this.props.fromX);
            cc.lineTo(this.props.toX, this.props.toY);
            cc.moveTo(this.props.toX - headlen * Math.cos(angle - Math.PI / 6), this.props.toY - headlen * Math.sin(angle - Math.PI / 6));
            cc.lineTo(this.props.toX, this.props.toY);
            cc.lineTo(this.props.toX - headlen * Math.cos(angle + Math.PI / 6), this.props.toY - headlen * Math.sin(angle + Math.PI / 6));
            cc.stroke();
            cc.restore();
        }
    };

    return arrow;
}

function initRectProps(props) {
    var canvas = document.getElementById("canvas");
    init(props, "x", canvas.width/2);
    init(props, "y", canvas.height/2);
    init(props, "width", 100);
    init(props, "height", 100);
    init(props, "rotate", 0);

    return props;
}

function initCircleProps(props) {
    var canvas = document.getElementById("canvas");
    init(props, "x", canvas.width/2);
    init(props, "y", canvas.height/2);
    init(props, "radius", 100);
    init(props, "endAngle", Math.PI*2);

    return props;
}

function initArrowProps(props) {
    var canvas = document.getElementById("canvas");
    init(props, "fromX", 0);
    init(props, "fromY", 0);
    init(props, "toX", 100);
    init(props, "toY", 100);
    init(props, "lineWidth", 2);

    return props;
}

function init(props, key, value) {
    if (!props[key]) {
        props[key] = value
    }
}

function Zoom(obj, props) {
    if (!props) props = {};

    init(props, 'duration', 500);
    const animation = {
        ...initAnimation(obj, props),
        beforeUpdate: function(ctx) {
            this.totalElapsedTime += ctx.timeElapsed;
            this.object.props.radius = (this.totalElapsedTime/(this.props.duration))*this.finalProps.radius;
            if (this.object.props.radius > this.finalProps.radius) {
                this.object.props.radius = this.finalProps.radius;
                this.state = "complete";
            }
        }
    };
    obj.props.radius = 0;
    return animation;
}

function ZoomOut(obj, props) {
    if (!props) props = {};

    init(props, 'duration', 500);
    const animation = {
        ...initAnimation(obj, props),
        beforeUpdate: function(ctx) {
            this.totalElapsedTime += ctx.timeElapsed;
            this.object.props.radius = this.finalProps.radius - (this.totalElapsedTime/(this.props.duration))*this.finalProps.radius;
            if (this.object.props.radius < 0) {
                this.object.props.radius = 0;
                this.state = "complete";
                this.object.state = "unstaged";
            }
        }
    };
    obj.props.radius = 0;
    return animation;
}

function Rotate(obj, props) {
    if (!props) props = {};

    init(props, 'duration', 500);
    init(props, 'initRotation', 0);
    const animation = {
        ...initAnimation(obj, props),
        beforeUpdate: function(ctx) {
            this.totalElapsedTime += ctx.timeElapsed;

            const dx = this.totalElapsedTime/this.props.duration;
            const dx2 = dx*dx;
            const dx2_1 = 1 - dx2;
            this.object.props.rotation = dx2*this.deltaRotation;
            if (dx >= 1) {
                this.object.props.rotation = this.finalProps.rotation;
                this.state = "complete";
            }
        }
    };
    initRotateDelta(animation);
    obj.props.rotation = props.initRotation;
    return animation;
}

function Point(obj, props) {
    if (!props) props = {};

    init(props, 'duration', 500);
    init(props, 'initToX', obj.props.fromX);
    init(props, 'initToY', obj.props.fromY);
    const animation = {
        ...initAnimation(obj, props),
        beforeUpdate: function(ctx) {
            this.totalElapsedTime += ctx.timeElapsed;

            const dx = this.totalElapsedTime/this.props.duration;
            const dx2 = dx*dx;
            const dx2_1 = 1 - dx2;
            this.object.props.toX = this.props.initToX + dx2*this.deltaToX;
            this.object.props.toY = this.props.initToY + dx2*this.deltaToY;
            if (dx2 >= 1) {
                this.object.props.toX = this.finalProps.toX;
                this.object.props.toY = this.finalProps.toY;
                this.state = "complete";
            }
        }
    };
    initToPosDelta(animation);
    obj.props.toX = props.initToX;
    obj.props.toY = props.initToY;
    return animation;
}

function Draw(obj, props) {
    if (!props) props = {};

    init(props, 'duration', 500);
    const animation = {
        ...initAnimation(obj, props),
        beforeUpdate: function(ctx) {
            this.totalElapsedTime += ctx.timeElapsed;

            const dx = this.totalElapsedTime/this.props.duration;
            const dx2 = dx*dx;
            const dx2_1 = 1 - dx2;
            this.object.props.endAngle = dx2*Math.PI*2;
            if (this.object.props.endAngle > 2*Math.PI) {
                this.object.props.endAngle = 2*Math.PI;
                this.state = "complete";
            }
        }
    };
    obj.props.endAngle = 0;
    return animation;
}

function Slide(obj, props) {
    if (!props) props = {};

    init(props, 'duration', 500);
    init(props, 'initX', 0);
    init(props, 'initY', 0);
    const animation = {
        ...initAnimation(obj, props),
        beforeUpdate: function(ctx) {
            this.totalElapsedTime += ctx.timeElapsed;
            
            const dt = this.totalElapsedTime/this.props.duration;
            const dt2 = dt;
            
            this.object.props.x = this.props.initX + dt2*this.deltaX;
            this.object.props.y = this.props.initY + dt2*this.deltaY;

            if (dt >= 1) {
                this.object.props.x = this.finalProps.x;
                this.object.props.y = this.finalProps.y;
                if (this.props.removeOnComplete) {
                    this.object.state = "unstaged";
                }
                this.state = "complete";
            }
        }
    };
    initPosDelta(animation);
    obj.props.x = props.initX;
    obj.props.y = props.initY;
    return animation;
}

function initAnimation(obj, props) {
    const animation = {
        object: obj,
        type: 'animation',
        state: 'active',
        finalProps: {...obj.props},
        props: {...props},
        totalElapsedTime: 0,
    };

    return animation;
}

function initPosDelta(animation) {
    animation.deltaX = animation.finalProps.x - animation.props.initX;
    animation.deltaY = animation.finalProps.y - animation.props.initY;
}

function initRotateDelta(animation) {
    animation.deltaRotation = animation.finalProps.rotation - animation.props.initRotation;
}

function initToPosDelta(animation) {
    animation.deltaToX = animation.finalProps.toX - animation.props.initToX;
    animation.deltaToY = animation.finalProps.toY - animation.props.initToY;
}