const numLines = 35;
const kMax = 8;
const radius = 240;

let res;

function setup() {
  var editor = ace.edit("editor");
  editor.setTheme("ace/theme/github_light_default");
  editor.session.setMode("ace/mode/javascript");
  editor.resize()

  const maxWidth = Math.floor(window.screen.availWidth * 0.8);
  const maxHeight = Math.floor(window.screen.availHeight * 0.95);
  res = Math.min(maxWidth, maxHeight);

  const canvas = createCanvas(res, res, P2D);
  canvas.parent("canvas-holder");
  background(255);
}
function drawBorder() {
    noFill();        
    stroke('#777');
    strokeWeight(1); 
    rect(-res/2, -res/2, res, res);
}


function getLinePoints(i, lineLength=1000) {
  const angle = (TWO_PI / numLines) * i;

  let x = radius * cos(angle);
  let y = radius * sin(angle);

  let tangentAngle = angle + PI / 2; // Perpendicular to radius

  let x1 = x + lineLength * cos(tangentAngle);
  let y1 = y + lineLength * sin(tangentAngle);
  let x2 = x - lineLength * cos(tangentAngle);
  let y2 = y - lineLength * sin(tangentAngle);

  return {x1, y1, x2, y2};
}

function getLine(i) {
  // get equation of the line in the form Ax + By + C = 0
  let {x1, y1, x2, y2} = getLinePoints(i);
  let A = y2 - y1;
  let B = x1 - x2;
  let C = x2 * y1 - x1 * y2;
  return {A, B, C};
}

function getIntersection(line1, line2) {
  let {A: A1, B: B1, C: C1} = line1;
  let {A: A2, B: B2, C: C2} = line2;

  let det = A1 * B2 - A2 * B1;
  if (det < 1e-6) {
    return null; // Lines are parallel
  } else {
    let x = (B2 * (-C1) - B1 * (-C2)) / det;
    let y = (A1 * (-C2) - A2 * (-C1)) / det;
    return {x, y};
  }
}

function getShape(i, k) {
  // if i is whole number
  if (Number.isInteger(i)) {
    let p1 = getIntersection(getLine(i - k), getLine(i + k));
    let p2 = getIntersection(getLine(i - k - 1), getLine(i + k));
    let p3 = getIntersection(getLine(i - k - 1), getLine(i + k + 1));
    let p4 = getIntersection(getLine(i - k), getLine(i + k + 1));
    return p1 ? [p1, p2, p3, p4] : [p2, p3, p4];
  } else {
    let p1 = getIntersection(getLine(i - k - 0.5), getLine(i + k + 0.5));
    let p2 = getIntersection(getLine(i - k - 1.5), getLine(i + k + 0.5));
    let p3 = getIntersection(getLine(i - k - 1.5), getLine(i + k + 1.5));
    let p4 = getIntersection(getLine(i - k - 0.5), getLine(i + k + 1.5));
    return [p1, p2, p3, p4];
  }
}

function drawShape(points, insetProportion=0) {
  const centroid = points.reduce((acc, p) => ({x: acc.x + p.x / points.length, y: acc.y + p.y / points.length}), {x:0, y:0});
  if (insetProportion > 0) {
    points = points.map(p => {
      let angle = atan2(p.y - centroid.y, p.x - centroid.x);
      return {
        x: centroid.x + (1 - insetProportion) * (p.x - centroid.x),
        y: centroid.y + (1 - insetProportion) * (p.y - centroid.y)
      };
    });
  }

  if (points.length == 3) {
    triangle(points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y);
  } else if (points.length == 4) {
    quad(points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y);
  }
}

function shade(colID) {
  switch (colID) {
    case 0:
    case true:
      fill(0, 0, 128, 255);
      break;
    // case 1:
    //   fill(0, 128, 255, 255);
    //   break;
    default:
      fill(0, 80, 180, 255);
      break;
  }
}

function shadeGradient(col1, col2, factor, steps=undefined) {
  if (steps) {
    factor = Math.floor(factor * steps) / (steps - 1);
  }

  let r = lerp(col1[0], col2[0], factor);
  let g = lerp(col1[1], col2[1], factor);
  let b = lerp(col1[2], col2[2], factor);
  let a = lerp(col1[3], col2[3], factor);
  fill(r, g, b, a);
}


let lastValidCode = "";
function drawShapes(frame) {
  // run user inputted shading program

  const userCode = ace.edit("editor").getValue();
  const getShadingProgram = (shadingCode) => `
  "use strict"; 
  const frameCount = ${frame}; 

  for (let i = 0; i < numLines; i++) {
    for (let di = 0; di <= 1; di++) {
      for (let k = 0; k < kMax; k++) {
        const i2 = i + di/2;
        const a = (TWO_PI / numLines) * i2;
        const r = k;


        ${shadingCode};

        noStroke();
        const points = getShape(i2, k);
        drawShape(points, 0.06);
      }
    }
  }
      
`;


  try {
    eval(getShadingProgram(userCode));
    lastValidCode = userCode;
  } catch (e) {
    console.error(e);

    eval(getShadingProgram(lastValidCode));
    return false;
  }
  return true;
}



let t = 0;

function draw() {
  background(255);
  // translate(width * 0.65, height * 0.45);
  translate(width * 0.5, height * 0.5);

  for (let i = 0; i < numLines; i++) {
    // draw tangent line
    let {x1, y1, x2, y2} = getLinePoints(i);
    stroke(0, 100);
    // line(x1, y1, x2, y2);
  }

  const success = drawShapes(t);
  if (!success) {
    document.getElementById("editor-holder").classList.add("error");
  } else {
    document.getElementById("editor-holder").classList.remove("error");
  }

  drawBorder();

  t++;
}