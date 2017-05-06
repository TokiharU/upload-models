var trees = [];
var mixers = [];
var container;
var camera, scene, renderer;
var clock = new THREE.Clock();
var N = 350;
var count_normal = 10;
var models = [];
var tick = 0;
var delta;
var geometry;
var imagedata;
var triangleMesh;
var targetList = [];
var keyboard = new THREEx.KeyboardState();
var key;
var check = false;
var intersects;
var originals = {};
originals.length = 0;

init();
animate();

function init()
{
    container = document.getElementById('container');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 40000);
    camera.position.set(N/2, N/3, N*1.5);
    camera.lookAt(new THREE.Vector3(N/2, 0, N/2));

    renderer = new THREE.WebGLRenderer({antialias: false});
    renderer.setSize(window.innerWidth, window.innerHeight);
    //renderer.setClearColor(0xff7F50, 1);
    
    container.appendChild(renderer.domElement);
    renderer.shadowMapEnabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
    window.addEventListener('resize', onWindowResize, false);

    
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var img = new Image();
    
    img.onload = function ()
    {
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        imagedata = context.getImageData(0, 0, img.width, img.height);
    
        addTriangle();    
        loadModel('models/trees/', 'Tree.obj', 'Tree.mtl');
        loadModel('models/trees/', 'Palma 001.obj', 'Palma 001.mtl'); 
        
        loadAnimatedModel('models/animated/parrot.js',  "parrot");
        loadAnimatedModel('models/animated/flamingo.js',  "flamongo");
        
    };
    
    img.src = 'lake.jpg';
    
    addSphere(500, 0, 500, 5000, 1, 'sky/sky.jpg', 'pics/sky.jpg', false, null);   

    lights();
}

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function render()
{
    delta = clock.getDelta();
    for (var i = 0; i < mixers.length; i++)
    {
        mixers[ i ].update(delta);
    }    
    move();
    keyboardstate();
    
    renderer.render(scene, camera);
}

function animate()
{
    
    if((originals.length === 2)&&(!check))
    {
        
        check = true;
        
        var x = 300; 
        var z = 150;
        var y = 20;
        
        addModel(x, y, z, 1, 20, track(x, y, z), "parrot");
        
        addModel( x, y, z, 15, null, null, "flamongo");
    }
    
    requestAnimationFrame(animate);

    render();
}

function move()
{
    tick =  delta;
    if (models !== null)
    {
        for (var i = 0; i < models.length; i++)
        {
           if (models[i].track !== null)
           {
                if (models[i].t >= models[i].T) models[i].t = 0;         
                models[i].mesh.position.copy(models[i].track.getPointAt(models[i].t/models[i].T));
                models[i].mesh.lookAt(models[i].track.getPointAt(((models[i].t+0.01)/models[i].T)%1));
                models[i].t += models[i].speed * tick;
            }
            else
            {
                models[i].mesh.position.y = intersects[0].point.y + 15;
                
                if (rotate < 0)
                {
                    rotate += delta * (Math.PI/20);
                    models[1].mesh.rotateOnAxis(new THREE.Vector3(0,0,1), delta * (Math.PI/20)); 
                }
                
                if (rotate > 0)
                {
                    rotate += delta * -(Math.PI/20);
                    models[1].mesh.rotateOnAxis(new THREE.Vector3(0,0,1), delta * -(Math.PI/20)); 
                }
                
                models[i].mesh.translateZ(models[i].speed * delta);
            }
        }
    }
}



function loadModel(path, oname, mname)
{
    //функция, выполняемая в процессе загрузки модели
    var onProgress = function (xhr) {
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% downloaded');
        }
    };

    //функция, выполняющая обработку ошибок, возникших в процессе загрузки
    var onError = function (xhr) {
        console.log('error');
    };

    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setBaseUrl(path);
    mtlLoader.setPath(path);


    //функция загрузки материала
    mtlLoader.load(mname, function (materials)
    {
        materials.preload();

        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath(path);

        //функция загрузки модели
        objLoader.load(oname, function (object)
        {
            object.castShadow = true;

            object.traverse( function ( child )
            {
                if ( child instanceof THREE.Mesh )
                {
                    child.castShadow = true;
                }
            } );
            
            object.position.x = 0;
            object.position.y = 0;
            object.position.z = 0;

            object.scale.set(0.1, 0.1, 0.1);

            tree = object;
                
            console.log(tree);
            trees.push(tree);
            for (var i = 0; i < count_normal; i++)
            {

                var x = Math.round((Math.random() * (N/15))*15);
                var z = Math.round((Math.random() * (N/15))*15);
                //var x = i * 15;
                //var z = i * 15;
                //var z = 200;
                //console.log(x,  z);
                var y = geometry.vertices[(z + x * N)].y;
                
                tree.position.set(x, y, z);
                scene.add(tree.clone());
            }
            //scene.add(tree);

        }, onProgress, onError);
    });
}

function loadAnimatedModel(path, name)
{
    var loader = new THREE.JSONLoader();
    loader.load(path, function (geometry)
    {
        geometry.computeVertexNormals();
        geometry.computeMorphNormals();
        var material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            morphTargets: true,
            morphNormals: true,
            vertexColors: THREE.FaceColors,
            shading: THREE.SmoothShading
        });
        var mesh = new THREE.Mesh(geometry, material);
        
        mesh.receiveShadow = true;
        mesh.castShadow = true;

        
        originals[name] = mesh;
        originals.length++;
    });
}

function addModel( x, y, z, sp, T, tr, name)
{
    var mesh = originals[name].clone();
    
        mesh.position.set(x,y,z);
        
        mesh.position.y =  y;

        mesh.scale.set(0.1, 0.1, 0.1);
        scene.add(mesh);

        var model = {};
        model.mesh = mesh;
        model.y = y;
        model.track = tr;
        model.phase = 0.0;
        model.speed = sp;
        model.T = T;
        model.t = 0;

        models.push(model);
        //track();
        var mixer = new THREE.AnimationMixer(mesh);
        mixer.clipAction(mesh.geometry.animations[ 0 ]).setDuration(1).play();
        mixers.push(mixer);
}

function track(x, y, z)
{
    {
        var curve1 = new THREE.CubicBezierCurve3(
                new THREE.Vector3(300, 20, 130), //P0
                new THREE.Vector3(300, 20, 25), //P1
                new THREE.Vector3(50, 20, 25), //P2
                new THREE.Vector3(50, 20, 130) //P3
                );
        var curve2 = new THREE.CubicBezierCurve3(
                new THREE.Vector3(50, 20, 170), //P0
                new THREE.Vector3(50, 20, 325), //P1
                new THREE.Vector3(300, 20, 325), //P2
                new THREE.Vector3(300, 20, 170) //P3
                );
        var vertices1 = [];
        vertices1 = vertices1.concat(curve1.getPoints(10), curve2.getPoints(10));
        //*
        for(var i = 0; i < vertices1.length; i++)
        {
            var ray = new THREE.Raycaster( vertices1[i], 
                                        new THREE.Vector3(0, -1, 0) );
           intersects = ray.intersectObjects( targetList );
           if ( intersects.length > 0 )
           {
            vertices1[i].y = intersects[0].point.y + y;
           } else
           if(i > 0)
           {
               vertices1[i].y = vertices1[i-1].y;
           }else 
           {
               vertices1[i].y = 20;
           }

        }
        
        var geometry = new THREE.Geometry();
        geometry.vertices = vertices1;
        var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
        var curveObject = new THREE.Line( geometry, material );
        scene.add(curveObject);

        var path = new THREE.CatmullRomCurve3(vertices1);
        path.closed = true;

        return path;
    }
}

function lights()
{
    var light = new THREE.SpotLight( 0xffffff);//9, 2, 0, Math.PI / 2 );
    //позиция источника освещения
    light.position.set( 0, N*2, N/2);
    //направление освещения
    light.target.position.set( N/2, 0, N/2 );
    //включение расчёта теней
    light.castShadow = true;
    //параметры области расчёта теней
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 5000;
    light.shadow.camera.fov = 75;
    light.shadow.bias = 0.0001;
    //размер карты теней
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 1024;
    scene.add( light );
    scene.add( light.target );
    
//    var helper = new THREE.CameraHelper( light.shadow.camera );
//    scene.add( helper );
//    var pointlight = new THREE.SpotLight(0xa3a3a3, 2, 00, 2);
//    pointlight.position.set(350, 500, 80);
//    pointlight.receiveShadow = true;
//    pointlight.castShadow = true;
//    scene.add(pointlight);
//
//    var light = new THREE.AmbientLight(0x202020); // soft white light
//    scene.add(light);
    
}

function addTriangle()
{
    geometry = new THREE.Geometry();    
    
    for (var i = 0; i < N; i++) {
        for (var j = 0; j < N; j++)
        {
            var heigh_1 = getPixel(imagedata, i, j);
            
            geometry.vertices.push(new THREE.Vector3(i , heigh_1/10.0, j));
        }
    }
    for (i = 0; i < N - 1; i++) {
        for (j = 0; j < N - 1; j++)
        {
            geometry.faces.push(new THREE.Face3((i + j * N), (i + 1 + j * N), (i + (j + 1) * N)));
            geometry.faces.push(new THREE.Face3((i + (j + 1) * N), ((i + 1) + j * N), ((i+1) + (j+1) * N)));
        

            geometry.faceVertexUvs[0].push([new THREE.Vector2(i/N, j/N),
                new THREE.Vector2((i+1)/N, j/N),
                new THREE.Vector2((i)/N, (j+1)/N)]);
            geometry.faceVertexUvs[0].push([new THREE.Vector2(i/N, (j+1)/N),
                new THREE.Vector2((i+1)/N, (j)/N),
                new THREE.Vector2((i+1)/N, (j+1)/N)]);
        }
    }
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        var tex = new THREE.ImageUtils.loadTexture('grasstile.jpg');
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set( 6, 6 );

        
        var mat = new THREE.MeshPhongMaterial({
            map: tex,
            side: THREE.DoubleSide
            //wireframe: true

        });
        triangleMesh = new THREE.Mesh(geometry, mat);
        triangleMesh.position.set(0.0, 0.0, 0.0);
        triangleMesh.scale.set(1.0, 1, 1.0);
        triangleMesh.receiveShadow = true;
        triangleMesh.castShadow = true;
        
        //добавление в массив плоскости
        targetList.push(triangleMesh);

        scene.add(triangleMesh);
    
}

function getPixel( imagedata, x, y )
{
    var position = ( x + imagedata.width * y ) * 4, data = imagedata.data;
    return data[ position ];
}

function addSphere(x, y, z, r, k, path, tex_bump, light, sky)
{
    var geometry = new THREE.SphereGeometry(r, 32, 32);
    var tex = new THREE.ImageUtils.loadTexture(path);
    tex.minFilter = THREE.NearestFilter;

    if (light)
        var material = new THREE.MeshBasicMaterial({
            map: tex,
            side: THREE.DoubleSide
        });
    else
        var material = new THREE.MeshBasicMaterial({
            map: tex,
            side: THREE.DoubleSide
        });
    material.bumpMap = THREE.ImageUtils.loadTexture(tex_bump);
    material.bumpScale = 2;
    var sphere = new THREE.Mesh(geometry, material);

    sphere.position.set(x, y, z);

    var planet = {};

    planet.sphere = sphere;
    planet.angle1 = 0;
    planet.angle2 = 1;
    planet.radius = x;
    planet.k = k;
    planet.sky = sky;

    //planets.push(planet);
    var maxAnisotropy = renderer.getMaxAnisotropy();
    sphere.anisotropy = maxAnisotropy;
    scene.add(sphere);
}
var rotate = 0;
function keyboardstate()
{
    if (keyboard.pressed("1"))
    {
        key = 1;
    } else if (keyboard.pressed("0"))
    {
        key = 0;
    } else if (keyboard.pressed("2"))
    {
        key = 2;
    } else if (keyboard.pressed("a"))
    {   
        if (rotate >= -(Math.PI / 8))
        {   
            rotate += delta * -(Math.PI/10);
            models[1].mesh.rotateOnAxis(new THREE.Vector3(0,0,1), delta * -(Math.PI/10)); 
        }
        models[1].mesh.rotateOnAxis(new THREE.Vector3(0,0,1), -rotate);
        models[1].mesh.rotateOnAxis(new THREE.Vector3(0,1,0), delta * (Math.PI/7));
        models[1].mesh.rotateOnAxis(new THREE.Vector3(0,0,1), rotate);

    } else if (keyboard.pressed("d"))
    {   
        if (rotate <= (Math.PI / 8))
        {  
            rotate += delta * (Math.PI/10);
            models[1].mesh.rotateOnAxis(new THREE.Vector3(0,0,1), delta * (Math.PI/10));
        }
        models[1].mesh.rotateOnAxis(new THREE.Vector3(0,0,1), -rotate);
        models[1].mesh.rotateOnAxis(new THREE.Vector3(0,1,0), delta * -(Math.PI/7));
        models[1].mesh.rotateOnAxis(new THREE.Vector3(0,0,1), rotate);
    }
    
    if (rotate >= Math.PI / 4)
    {
        
    }
    if (key === 1)
    {
        var relativeCameraOffset = new THREE.Vector3(0,7,-30);
        var m1 = new THREE.Matrix4();
        var m2 = new THREE.Matrix4();
        m1.extractRotation(models[0].mesh.matrixWorld);
        m2.extractPosition(models[0].mesh.matrixWorld);
        m1.multiplyMatrices(m2, m1);
        var cameraOffset = relativeCameraOffset.applyMatrix4(m1);
        camera.position.copy(cameraOffset);
        camera.lookAt(models[0].mesh.position );
        
    } else if (key === 0)
    {
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 40000);
        camera.position.set(N/2, N/3, N*1.5);
        camera.lookAt(new THREE.Vector3(N/2, 0, N/2));
        key = 0;
    } else if (key === 2)
    {
        var relativeCameraOffset = new THREE.Vector3(0,7,-30);
        var m1 = new THREE.Matrix4();
        var m2 = new THREE.Matrix4();
        m1.extractRotation(models[1].mesh.matrixWorld);
        m2.extractPosition(models[1].mesh.matrixWorld);
        m1.multiplyMatrices(m2, m1);
        var cameraOffset = relativeCameraOffset.applyMatrix4(m1);
        camera.position.copy(cameraOffset);
        camera.lookAt(models[1].mesh.position );        
    }
}