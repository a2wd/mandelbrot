/*
* Fractals in Javascript
* A project to draw the Mandelbrot set
* in the HTML5 canvas element
*/

//Append function to add html
function append(element, text)
{
	element.innerHTML = element.innerHTML + text;
}

//Init canvas - initialise a canvas and return an object reference
function initCanvas(el, width, height)
{
	//Add the canvas to the dom
	append(el, "<canvas id='canvas'></canvas>");

	//Get a handler for the canvas
	canvas = document.getElementById("canvas");

	//Size the canvas
	canvas.width = width;
	canvas.height = height;

	//return the canvas handler
	return canvas;
}

function blit(pixels, x, y, r, g, b, a)
{
	//Pixel array indexed by x (current col) + y*width to find current row
	//Multiplied by 4 as each pixel consists of R, G, B, alpha
	var index = (x + (y * pixels.width) ) * 4;
	pixels.data[index] = r;
	pixels.data[index+1] = g;
	pixels.data[index+2] = b;
	pixels.data[index+3] = a;
}

//Mandel map takes an x and y height/width of canvas in the constructor
//and with the this.x/this.y functions returns the mandel range for a
//given pixel from the canvas passed as an input parameter.
function mandelMap(x, y)
{
	//Define mandel set
	this.mx0 = -2.5;
	this.mx1 = 1;
	this.my0 = -1;
	this.my1 = 1;

	//Set limits of canvas
	this.lx = x;
	this.ly = y;

	//Define x & y getters
	this.x = function(px) {
		return ( ( (this.mx1 - this.mx0) / this.lx ) * px ) + this.mx0;
	};
	this.y = function(py) {
		return ( ( (this.my1 - this.my0) / this.ly ) * py ) + this.my0;
	};

	//Allow for zooming into the mandel set about point x,y by scale s
	this.zoom = function(x, y, s) {

		//Transform x, y from canvas points to mandel mapping
		var xt = this.x(x);
		var yt = this.y(y);

		//Find new widths for planes
		var dxt = (this.mx1 - this.mx0) * s;
		var dyt = (this.my1 - this.my0) * s;

		//Set new mappings
		this.mx0 = xt - (dxt/2);
		this.mx1 = xt + (dxt/2);
		this.my0 = yt - (dyt/2);
		this.my1 = yt + (dyt/2);
	}
}

//Draw mandelbrot element
function drawMandel(canvas, context, mapping)
{
	//Create imageData array for direct blit'ing
	var iD = context.createImageData(iMax, jMax);

	//Mandel set lies in region x(-2.5 to 1), y(-1 to 1) [dx=3.5, dy=2]
	for(var j=0; j<jMax; j++)
	{
		for(var i=0; i<iMax; i++)
		{
			//Initialise looping variables
			var itn = 0;
			var maxIterations = 255;

			//Map x and y to be the scaled co-ords of the current pixel[i,j]
			//in relation to the mandel set (-2.5 to 1, -1 to 1).
			var x0 = mapping.x(i);
			var y0 = mapping.y(j);

			//Initialise x and y values
			var x=0;
			var y=0;

			//Loop to find if this number is part of the mandelbrot set
			while( ( ( (x*x) + (y*y) ) < (2 * 2) ) && ( itn < maxIterations) )
			{
				//Seperate into components of imaginary number
				temp = (x*x) - (y*y) + x0;
				y = (2*x*y) + y0;
				x = temp;
				itn++;
			}
			//Copy colour into pixel array
			blit(iD, i, j, itn, itn, itn, 255);
		}
	}

	//Copy imageData back into the canvas
	context.putImageData(iD,0,0);

	//Release mandelMap object
	mapping = undefined;
}

//Canvas onClick function
function canvasClick(event) 
{
	//Prevent usual handling of clicks
	event.preventDefault();
	event.stopPropagation();

	//Initialise mouse co-ordinate variables
	var x;
	var y;

	//Find x & y co-ordinates relative to page
	if(event.pageX != undefined &&  event.pageY != undefined)
	{
		x = event.pageX;
		y = event.pageY;
	}
	//Handle browsers without a defined pageX/pageY
	else
	{
		x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
		y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	}

	//Transform coordinates based on canvas offset
	x -= canvas.offsetLeft;
	y -= canvas.offsetTop;

	//To prevent calling twice, only act on mouseup
	if(event.type === "mouseup")
	{
		//Set zoom scale to zoom in on left click, or out on right click
		var scale = 1;
		if(event.button === 0)
		{
			scale = 0.5;
		}
		else if(event.button === 2)
		{
			scale = 2;
		}
		
		//Call zoom function & redraw mandelbrot image
		mapping.zoom(x, y, scale);
		drawMandel(canvas, context, mapping);
	}

}

//Find mandelbrot div element
var mandelbrot = document.getElementById("mandelbrot");

//Call initialiser and get drawing handler
var canvas = initCanvas(mandelbrot, 700, 400);
var context = canvas.getContext("2d");

//Define bounds of drawing
var jMax = canvas.height;
var iMax = canvas.width;

//Initialise mapping variable to convert pixels from
//canvas coordinates to a mapping in the mandelbrot set
mapping = new mandelMap(iMax, jMax);

//Draw the mandelbrot set
drawMandel(canvas, context, mapping);

//Remove right click menu on canvas (will replace with zoom out)
canvas.oncontextmenu = function(event) {
	event.preventDefault();
	event.stopPropagation();
	return false;
};

//Prepare an onclick handler for the canvas to deal with zooming
canvas.addEventListener("mousedown", canvasClick, false);
canvas.addEventListener("mouseup", canvasClick, false);
