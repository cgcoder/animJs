animJs.start();
(async () => {
  const obj = [];

  for (let i = 0; i < 4; i++) {
    const r1 = Rect({ x: 150, y: 150 + i * 150, width: 120, height: 120, rotation: 2*Math.PI });
    const r2 = Rect({ x: 150 + 500, y: 150 + i * 150, width: 120, height: 120, rotation: 2*Math.PI });
    
    await animJs.play(Slide(r1, { duration: 750, initX: -100, initY: 400 }));
    await animJs.play(Slide(r2, { duration: 750, initX: -100, initY: 400 }));
    //animJs.play(Draw(circle, {duration: 1000, initX: -100, initY: 400}));
    obj.push(r1);
    obj.push(r2);

    const arrow = Arrow({ fromX: r1.props.x + r1.props.width, fromY: r1.props.y + r1.props.height/2, 
                            toX: r2.props.x, toY: r2.props.y + r2.props.height/2});
    await animJs.play(Point(arrow));
}

//   //await animJs.play(Zoom(circle, {duration: 0.25}));
//   await animJs.wait(2000);
//   obj.reverse();
//   for (o of obj) {
//     const initX = o.props.x;
//     const initY = o.props.y;
//     o.props.x = -100;
//     o.props.y = 400;
//     animJs.play(Slide(o, { duration: 500, initX: initX, initY: initY, removeOnComplete: true }));
//     await animJs.wait(100);
//   }
})();
