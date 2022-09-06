This is a playground to learn threejs + XR.

It's a mashup of own code, some three js examples, some code from [xr-locomotion-start](https://github.com/SamsungInternet/xr-locomotion-starter), the ui is done with [three-mesh-ui](https://github.com/felixmariotto/three-mesh-ui) and there are some other snippets around.

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
