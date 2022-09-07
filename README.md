__This project has some funcitonality that works and some that is unfinished (see below). It was started as an exploration on how to use three js + XR.__

It's a mashup of my own code and the modified code of:
  - threejs example on using haptics
  - threejs example on dragging objects
  - some general ui and a ui attached to the left controller using [three-mesh-ui](https://github.com/felixmariotto/three-mesh-ui)
  - __unfinished__ integration of teleport locomotion and camera rotation using the code from [xr-locomotion-start](https://github.com/SamsungInternet/xr-locomotion-starter)

It was tested with a Quest 2.

To use it:

- Install dependencies: `npm install`
- Start up a https server to serve index.html. You can use `http-server.py`


## Credits
- Earth model by Akshat is licensed under Creative Commons Attribution


## TODO
- Finish adding teleport system from xr-locomotion-start
- Camera rotation is now working
- Add text on how to rotate camera with stick
- Add some more segments to the line shown in xr-locomotion-start
- Add build system from xr-locomotion-start
- Adjust debug menu buttons to the bottom
- Make the log do a JSON.stringify on the objects being logged
- Make the debug menu buttons do something
- Replace current drag line selection with line and circle at end from https://github.com/felixmariotto/three-mesh-ui


## Note to self
To test locomotion interactions with devtools:

enter VR: `document.getElementById('VRButton').click()`

start teleport: `window.vrplayground.teleport.handleUp({detail:{value:1,controller: window.vrplayground.controllers.left.controller}});`

finish teleport: `window.vrplayground.teleport.handleUpEnd({detail:{value:0,controller: window.vrplayground.controllers.left.controller}});`
