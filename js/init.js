import * as THREE from '../build/three.module.js';
import { STLLoader } from './jsm/loader/STLLoader.js';
import { TrackballControls } from './jsm/controls/TrackballControls.js';
import { TransformControls } from './TransformControls.js';

let camera, renderer;
let scene;
let container;
let controls, transformControl;
let select = true;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(1, 1);
let group, hiddengroup
let landmarkGroup = new THREE.Group();
landmarkGroup.name = "landmarkGroup"
let AxisGroup = new THREE.Group();
AxisGroup.name = "AxisGroup"
let planeGroup = new THREE.Group();
planeGroup.name = "planeGroup"
let transformControlsGroup = new THREE.Group();
transformControlsGroup.name = "transformControlsGroup"

let Planearray = [];
let selectedLandmark
let linepoints =[]

init();
animate();
window.addEventListener("resize", Resize);
function Resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
}
function init() {
    // CreateRenderer();
    container = document.getElementById('canvas-container');
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.clearDepth();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x808080); // Set background color to blue
    CreateCamera();
    AddLightsToScene();
    // CreateTransformControls();
    renderer.setAnimationLoop(render);    
    container.appendChild(renderer.domElement);
    CreateTrackballControls();
    // transformControl = new Transfo/rmControls(camera, renderer.domElement);
}
// Todo
// try adding orthocamera and 2. try after removing window.devicepi.. from width nd height
// 3dmu ref -> arrowhelper and move points using helper
// camera = new THREE.OrthographicCamera(-cWIDTH / 2, cWIDTH / 2, cHEIGHT / 2, -cHEIGHT / 2, 0.1, 50000);
function CreateCamera() {
    const ASPECT_RATIO = (window.innerWidth) / (window.innerHeight);
    let WIDTH = (window.innerWidth) * window.devicePixelRatio;
    let HEIGHT = (window.innerHeight) * window.devicePixelRatio;
    camera = new THREE.OrthographicCamera(-WIDTH / 2, WIDTH / 2, HEIGHT / 2, -HEIGHT / 2, 0.1, 50000);
    // camera = new THREE.PerspectiveCamera(40, ASPECT_RATIO, 0.1, 5000);
    camera.viewport = new THREE.Vector4(Math.floor(WIDTH), Math.floor(HEIGHT), Math.ceil(WIDTH), Math.ceil(HEIGHT));
    scene.add(camera);
}
function CreateTrackballControls() {
    if (undefined != controls)
        controls.dispose();
    controls = new TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 1.0;
}

function AddLightsToScene() {
    const light = new THREE.DirectionalLight();
    light.position.set(0.5, 0.5, 1);
    scene.add(light);
    const light1 = new THREE.DirectionalLight();
    light1.position.set(-0.5, -0.5, -1);
    scene.add(light1);
}
function CreateRenderer() {
    renderer = new THREE.WebGLRenderer();
    // renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.setClearColor(0x000000);
    renderer.shadowMap.enabled = true;
    renderer.autoClear = true;
    renderer.alpha = true;
}
function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    renderer.render(scene, camera);
    controls.update();
}
document.getElementById("canvas-container").onclick = function (e) {
    if (select) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;
        // mouse.x = ((event.clientX - renderer.domElement.offsetLeft) / renderer.domElement.width) * 2 - 1;
        // mouse.y = -((event.clientY - renderer.domElement.offsetTop) / renderer.domElement.height) * 2 + 1;
        onCanvasClick();
    }
}

document.getElementById("actual-btn").onchange = function (e) {
    LoadModels(this.files);
    this.value = null;
}

function LoadModels(stlfiles) {
    for (var i = 0; i < stlfiles.length; i++) {
        LoadSTL(stlfiles[i]);
    }
    scene.add(group);
}

function LoadSTL(stlfile) {
    if (!(stlfile.name.endsWith("stl") || stlfile.name.endsWith("STL")))
        return;
    group = new THREE.Group();
    hiddengroup = new THREE.Group();

    const loader = new STLLoader();
    const objectURL = URL.createObjectURL(stlfile);
    loader.load(objectURL, function (desgeometry) {
        const material = new THREE.MeshPhongMaterial({
            color: 0xffdead,
            opacity: 0.5,
            transparent: true,
            side: THREE.DoubleSide,
            clippingPlanes: Planearray
        });
        desgeometry = new THREE.Geometry().fromBufferGeometry(desgeometry);
        const clippedColorFront = new THREE.Mesh(desgeometry, material);
        clippedColorFront.position.set(0,0,0);
        clippedColorFront.name = "Femur bone"
        clippedColorFront.castShadow = true;
        clippedColorFront.renderOrder = 20;
        material.side = THREE.DoubleSide;
        clippedColorFront.geometry.computeBoundingBox();
        clippedColorFront.updateMatrixWorld(true);
        group.add(clippedColorFront);
        let bbox = new THREE.Box3();
        bbox.setFromObject(group);
        setView()
        controls.target.set(bbox.getCenter().x, bbox.getCenter().y, bbox.getCenter().z);
        
    },
    (error) => {
        console.log(error);
    });

}
function setView(){
    let distFromCamera =5000;
    const box3 = new THREE.Box3().setFromObject(group);
    const center = new THREE.Vector3();
    box3.getCenter(center);
    let ZaxisVector = new THREE.Vector3(0, 0, 1);
    let YaxisVector = new THREE.Vector3(0, 1, 0);
    let newCameraPos = center.clone().add(YaxisVector.negate().clone().multiplyScalar(distFromCamera));
    camera.position.set(newCameraPos.x, newCameraPos.y, newCameraPos.z);
    camera.lookAt(center);
    camera.up = ZaxisVector;
    controls.target.set(center.x, center.y, center.z);
}
const radioButtons = document.querySelectorAll('#point-options input[type="radio"]');
    
radioButtons.forEach((radio) => {
    radio.addEventListener('change', () => {
        radioButtons.forEach((btn) => {
            btn.parentElement.style.backgroundColor = ''; // Reset background color
            btn.parentElement.style.color = ''; // Reset text color
            removeTransformControls()
        });        
        if (radio.checked) {
            radio.parentElement.style.backgroundColor = 'lightgrey'; // Change background color
            selectedLandmark = radio.value;
            // onCanvasClick()
        }
    });
});

function onCanvasClick(e) {
    // mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    // mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);  
    let intersection = raycaster.intersectObjects(group.children);
    let landmarkName;
    let transformControlName;
    if(intersection.length > 0){
        switch(selectedLandmark){
            case 'Femur Center':
                landmarkName = "Femur Center";
                transformControlName = "Femur Center TC"
                break;
            case 'Hip Center':
                landmarkName = "Hip Center";
                transformControlName = "Hip Center TC"
                break;
            case 'Femur Proximal Canal':
                landmarkName = "Femur Proximal Canal";
                transformControlName = "Femur Proximal TC"
                break;
            case 'Femur Distal Canal':
                landmarkName = "Femur Distal Canal";
                transformControlName = "Femur Distal TC"
                break;
            case 'Medial Epicondyle':
                landmarkName = "Medial Epicondyle";
                transformControlName = "Medial Epicondyle TC"
                break;
            case 'Lateral Epicondyle':
                landmarkName = "Lateral Epicondyle";
                transformControlName = "Lateral Epicondyle TC"
                break;
            case 'Distal Medial Pt':
                landmarkName = "Distal Medial Pt";
                transformControlName = "Distal Medial Pt TC"
                break;
            case 'Distal Lateral Pt':
                landmarkName = "Distal Lateral Pt";
                transformControlName = "Distal Lateral Pt TC"
                break;
            case 'Posterior Medial Pt':
                landmarkName = "Posterior Medial Pt";
                transformControlName = "Posterior Medial TC"
                break;
            case 'Posterior Lateral Pt':
                landmarkName = "Posterior Lateral Pt";
                transformControlName = "Posterior Lateral TC"
                break;
            default:
                break;
        }
        drawLandmark(intersection[0].point,landmarkName,transformControlName )
    }
    
}
function drawLandmark(intersectionPoint,landmarkName,transformControlName){
    if(landmarkGroup.children.length >0 ){
        checkIfLandmarkExist(intersectionPoint,landmarkName)
    }
    else{
        CreateSphereGeometrywithpoint(intersectionPoint,landmarkName,transformControlName);
    } 
}
function checkIfLandmarkExist(intersectionPoint,landmarkName,transformControlName){
    let landmarkExists = false;    
    for (let i = 0; i < landmarkGroup.children.length; i++) {
        if (landmarkGroup.children[i].name === landmarkName ) {
            landmarkExists = true;
            if(scene.getObjectByName(`${landmarkName} TC`) === false){
                let transformControls = new TransformControls(camera, renderer.domElement);
                let landmark = scene.getObjectByName(landmarkName, true)
                transformControls.attach(landmark);
                scene.add(transformControls);
                transformControls.name = `${landmarkName} TC`;  // Give a name to the TransformControls
                console.log(`TransformControls attached to ${landmarkName}`);
            }
            
        }
    }

    if (!landmarkExists) {
        CreateSphereGeometrywithpoint(intersectionPoint, landmarkName,transformControlName);
    } 
}
function CreateSphereGeometrywithpoint(point, SphereName,transformControlName) {
    let obj = scene.getObjectByName(SphereName, true);
    if (undefined != obj)
        scene.remove(obj);
    const geometry = new THREE.SphereGeometry(0.8, 64, 64);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(geometry, material);  
    sphere.position.set(point.x, point.y, point.z);
    sphere.name = SphereName;
    CreateTransformControls(sphere,transformControlName)  
    landmarkGroup.add(sphere);
    scene.add(landmarkGroup)  
    scene.add(transformControl);    
}

function CreateTransformControls(sphere,transformControlName) {
    if (undefined != transformControl)
        transformControl.dispose()
    transformControl = new TransformControls(camera, renderer.domElement);
    transformControl.name = transformControlName;
    transformControl.attach(sphere);
    transformControl.addEventListener('change', render);
    transformControl.addEventListener('dragging-changed', function (event) {
        controls.enabled = !event.value;
    });
    window.addEventListener('keydown', function (event) {
        switch (event.key) {
            case 'w': // W
                transformControl.setMode("translate");
                break;
            case 'r': // R
                transformControl.setMode("rotate");
                break;
        }
    });
}
function activateLandmark(){

}
function deactivateLandmark(){
    scene.remove(transformControl)
}
function removeTransformControls() {
    for (let i = scene.children.length - 1; i >= 0; i--) {
        const child = scene.children[i];
        // Check if the child is an instance of TransformControls
        if (child.isTransformControls) {
            child.visible = false
            console.log('TransformControls removed from the scene');
        }
    }
}
document.getElementById("axesAndPlanes").onclick = function(e){
    isAnyRadioButtonChecked() 
    createAxes()
}
function createAxes(){
    CreateMechanicalAxisandAxialPlane();
    // CreateAnatomicalAxisandAxialPlane()  --> landmarks ?
    CreateTEA();
    CreatePCA();
    ProjectEpicondlyeAxisOnDistalPlane();
    CreateAnteriorLine()
    CreateVarusValgusAngle()
    ProjectAnteriorLineOnVarusPlane()
    CreateLateralLine()
    CreateFlexionPlane();
    // HideEntities()
    
}
function HideEntities(){
    let obj
    obj = scene.getObjectByName("Anterior Line", true);
    if (undefined != obj)
        obj.visible = false;
    obj = scene.getObjectByName("Axial Plane")
    if (undefined != obj)
        obj.visible = false;
    obj = scene.getObjectByName("Projected Epicondyle Axis")
    if (undefined != obj)
        obj.visible = false;
    obj = scene.getObjectByName("Projected Anterior Line")
    if (undefined != obj)
        obj.visible = false;
    // obj = scene.getObjectByName("Lateral Line")
    // if (undefined != obj)
    //     obj.visible = false;
    obj = scene.getObjectByName("Temp Anterior line")
    if (undefined != obj)
        obj.visible = false;
    obj = scene.getObjectByName("TEA-Trans Epicondyle Axis")
    if (undefined != obj)
        obj.visible = false;
    obj = scene.getObjectByName("PCA-Posterior Condyle Axis")
    if (undefined != obj)
        obj.visible = false;
    obj = scene.getObjectByName("Mechanical Axis")
    if (undefined != obj)
        obj.visible = false;
    
}

function CreateLateralLine() {
    let obj = scene.getObjectByName("Lateral Line", true);
    if (undefined != obj)
        scene.remove(obj);

    let anteriorLine = scene.getObjectByName("Anterior Line", true);
    let FemurCenter = scene.getObjectByName("Femur Center", true);
    let MechAxisObject = scene.getObjectByName("Mechanical Axis", true);
    if (undefined == anteriorLine || undefined == FemurCenter || undefined == MechAxisObject)
        return;
    var anteriorLinePts = anteriorLine.geometry.attributes.position.array;

    var anteriorLineaxis = new THREE.Vector3(anteriorLinePts[3] - anteriorLinePts[0], anteriorLinePts[4] - anteriorLinePts[1], anteriorLinePts[5] - anteriorLinePts[2]);
    anteriorLineaxis.normalize();
    linepoints[1] = FemurCenter.position.clone();
    linepoints[0] = FemurCenter.position.clone().add(anteriorLineaxis.clone().multiplyScalar(15));// new THREE.Vector3(anteriorLinePts[3], anteriorLinePts[4], anteriorLinePts[5]);
    // CreateLine("Temp Epicondyle axis");

    //Creation of temp axis perpendicular to the epicondyle axis
    var MechAxisArraypts = MechAxisObject.geometry.attributes.position.array;
    // var Mechaxis = new THREE.Vector3(MechAxisArraypts[0] - MechAxisArraypts[3], MechAxisArraypts[1] - MechAxisArraypts[4], MechAxisArraypts[2] - MechAxisArraypts[5]);
    var Mechaxis = new THREE.Vector3(MechAxisArraypts[3] - MechAxisArraypts[0], MechAxisArraypts[4] - MechAxisArraypts[1], MechAxisArraypts[5] - MechAxisArraypts[2]);
    Mechaxis.normalize();

    let Lateralaxis = Mechaxis.clone().cross(anteriorLineaxis);
    Lateralaxis.normalize();

    linepoints[0] = FemurCenter.position.clone();
    linepoints[1] = FemurCenter.position.clone().add(Lateralaxis.clone().multiplyScalar(10));// new THREE.Vector3(SaggAxisArraypts[3], SaggAxisArraypts[4], SaggAxisArraypts[5]);
    CreateLine("Lateral Line");

}
function ProjectAnteriorLineOnVarusPlane(){
    let obj = scene.getObjectByName("Projected Anterior Line", true);
    if (undefined != obj)
        scene.remove(obj);
    let epicondyleAxis = scene.getObjectByName("Anterior Line", true);

    let varusValgusPlane = scene.getObjectByName("Varus-Valgus Plane", true);
    if (undefined == epicondyleAxis || undefined == varusValgusPlane)
        return;
    varusValgusPlane.updateMatrixWorld();
    ProjectLineOnPlane(epicondyleAxis, varusValgusPlane, "Projected Anterior Line");    
}

function CreateTEA() {
    removeTransformControls()
    let obj = scene.getObjectByName("TEA-Trans Epicondyle Axis", true);
    if (undefined != obj)
        AxisGroup.remove(obj);
    let firstpoint = scene.getObjectByName("Medial Epicondyle", true);
    let secondpoint = scene.getObjectByName("Lateral Epicondyle", true);
    if (undefined == firstpoint || undefined == secondpoint)
        return;
    linepoints[0] = firstpoint.position;
    linepoints[1] = secondpoint.position;
    CreateLine("TEA-Trans Epicondyle Axis");
}
function CreatePCA() {
    let obj = scene.getObjectByName("PCA-Posterior Condyle Axis", true);
    if (undefined != obj)
        AxisGroup.remove(obj);
    let firstpoint = scene.getObjectByName("Posterior Medial Pt", true);
    let secondpoint = scene.getObjectByName("Posterior Lateral Pt", true);
    if (undefined == firstpoint || undefined == secondpoint)
        return;
    linepoints[0] = firstpoint.position;
    linepoints[1] = secondpoint.position;
    CreateLine("PCA-Posterior Condyle Axis");
}
function CreateLine(Linename) {
    if(scene.getObjectByName(Linename) === true){
        return;
    }
    else{
        const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
        let pointsposition = [linepoints[0], linepoints[1]]
        const geometry = new THREE.BufferGeometry().setFromPoints(pointsposition);
        const line = new THREE.Line(geometry, material);
        if (Linename == undefined) {
            line.name = "line";
        }
        else
            line.name = Linename
        line.geometry.attributes.position.needsUpdate = true;
        AxisGroup.add(line);
        scene.add(AxisGroup)
        line.geometry.verticesNeedUpdate = true;
    }
    
}

document.getElementById("Views").onchange = function (e) {
    if (undefined == group)
        return;

    var views = document.getElementById("Views");
    var getvalue = views.options[views.selectedIndex].value;
    if (undefined == views.selectedIndex)
        return;

    let distfromcamera;
    if (camera.type == "OrthographicCamera")
        distfromcamera = 900;
    else
        distfromcamera = 1600;
    const box3 = new THREE.Box3().setFromObject(group);
    const center = new THREE.Vector3();
    box3.getCenter(center);

    let mechanicalaxis = scene.getObjectByName("Mechanical Axis", true);
    let mechanicalaxisvector;
    if (undefined == mechanicalaxis) {
        mechanicalaxisvector = new THREE.Vector3(0, 0, 1);
    }
    else {
        let arr = mechanicalaxis.geometry.attributes.position.array;
        let frompoint = new THREE.Vector3(arr[0], arr[1], arr[2]);
        let topoint = new THREE.Vector3(arr[3], arr[4], arr[5]);
        mechanicalaxisvector = topoint.clone().sub(frompoint);
        mechanicalaxisvector.normalize();
    }

    if ("Front-view" == getvalue || "Back-view" == getvalue) {
        let tempcoronalaxisvector;
        let coronalcutplane = scene.getObjectByName("Coronal Cut Plane", true);
        if (undefined == coronalcutplane)
            coronalcutplane = scene.getObjectByName("Mech - TEA Coronal", true);
        if (undefined == coronalcutplane) {
            tempcoronalaxisvector = new THREE.Vector3(0, 1, 0);
        }
        else {
            let pt = scene.getObjectByName("Post Lateral Extent", true);
            tempcoronalaxisvector = calculateNormals(coronalcutplane, pt.position.clone());
            tempcoronalaxisvector.normalize();
        }
        let newcamerapos;
        if ("Front-view" == getvalue) {
            newcamerapos = center.clone().add(tempcoronalaxisvector.clone().multiplyScalar(distfromcamera));
            camera.position.set(newcamerapos.x, newcamerapos.y, newcamerapos.z);
        }
        else {
            newcamerapos = center.clone().add(tempcoronalaxisvector.negate().clone().multiplyScalar(distfromcamera));
            camera.position.set(newcamerapos.x, newcamerapos.y, newcamerapos.z);
        }
        camera.lookAt(center);
        camera.up = mechanicalaxisvector;
        controls.target.set(center.x, center.y, center.z);
    }
    
    else if ("Side 1-view" == getvalue || "Side 2-view" == getvalue) {
        let tempSagittalaxisvector;
        let sagittalcutplane = scene.getObjectByName("Sagittal Cut Plane", true);
        if (undefined == sagittalcutplane)
            sagittalcutplane = scene.getObjectByName("Mech - TEA Sagittal", true);
        if (undefined == sagittalcutplane) {
            tempSagittalaxisvector = new THREE.Vector3(1, 0, 0);
        }
        else {

            let pt = scene.getObjectByName("Medial Epicondyle", true);
            tempSagittalaxisvector = calculateNormals(sagittalcutplane, pt.position.clone());
            tempSagittalaxisvector.normalize();
        }
        if ("Side 1-view" == getvalue) {
            let newcamerapos = center.clone().add(tempSagittalaxisvector.clone().multiplyScalar(distfromcamera));
            camera.position.set(newcamerapos.x, newcamerapos.y, newcamerapos.z);
        }
        else {
            let newcamerapos = center.clone().add(tempSagittalaxisvector.negate().clone().multiplyScalar(distfromcamera));
            camera.position.set(newcamerapos.x, newcamerapos.y, newcamerapos.z);
        }
        camera.up = mechanicalaxisvector;
        camera.lookAt(center);
        controls.target.set(center.x, center.y, center.z);
    } 
    else if ("Top-view" == getvalue || "Bottom-view" == getvalue) {
        let tempcoronalaxisvector;

        let distalcutplane = scene.getObjectByName("Distal Cut Plane", true);
        if (undefined == distalcutplane)
            distalcutplane = scene.getObjectByName("Mech Distal Resect Plane - 10mm", true);

        if (undefined == distalcutplane) {
            tempcoronalaxisvector = new THREE.Vector3(0, 1, 0);
        }
        else {
            let pt = scene.getObjectByName("Distal Medial Extent", true);
            tempcoronalaxisvector = calculateNormals(distalcutplane, pt.position.clone());
            tempcoronalaxisvector.normalize();
        }
        if ("Top-view" == getvalue) {
            let newcamerapos = center.clone().add(mechanicalaxisvector.clone().multiplyScalar(distfromcamera));
            camera.position.set(newcamerapos.x, newcamerapos.y, newcamerapos.z);
        }
        else {
            let newcamerapos = center.clone().add(mechanicalaxisvector.negate().clone().multiplyScalar(distfromcamera));
            camera.position.set(newcamerapos.x, newcamerapos.y, newcamerapos.z);
        }
        camera.up = tempcoronalaxisvector;
        camera.lookAt(center);
        controls.target.set(center.x, center.y, center.z);
    } 
}

function CreateMechanicalAxisandAxialPlane() {
    let obj = scene.getObjectByName("Mechanical Axis", true);
    if (undefined != obj)
        scene.remove(obj);
    obj = scene.getObjectByName("Axial Plane", true);
    if (undefined != obj)
        scene.remove(obj);
    let firstpoint = scene.getObjectByName("Femur Center", true);
    let secondpoint = scene.getObjectByName("Hip Center", true);
    if (undefined == firstpoint || undefined == secondpoint)
        return;
    linepoints[0] = firstpoint.position;
    linepoints[1] = secondpoint.position;
    CreateLine("Mechanical Axis");
    linepoints[1] = firstpoint.position;
    linepoints[0] = secondpoint.position;
    CreatePlane(firstpoint.position, "Axial Plane");
}
function CreateDistalMedialPlane() {
    let obj = scene.getObjectByName("Mechanical Axis", true);
    if (undefined != obj)
        scene.remove(obj);
    obj = scene.getObjectByName("Distal Medial Plane", true);
    if (undefined != obj)
        scene.remove(obj);
    let firstpoint = scene.getObjectByName("Femur Center", true);
    let secondpoint = scene.getObjectByName("Hip Center", true);
    if (undefined == firstpoint || undefined == secondpoint)
        return;
    linepoints[0] = firstpoint.position;
    linepoints[1] = secondpoint.position;
    CreateLine("Mechanical Axis");
    linepoints[1] = firstpoint.position;
    linepoints[0] = secondpoint.position;
    CreatePlane(firstpoint.position, "Axial Plane");
}
function CreatePlane(spherepos, PlaneName) {
    var pos = scene.position;
    var uvector = new THREE.Vector3(linepoints[0].x - linepoints[1].x, linepoints[0].y - linepoints[1].y, linepoints[0].z - linepoints[1].z);
    uvector.normalize();

    const pg = new THREE.PlaneGeometry(100, 100);
    const pm = new THREE.MeshBasicMaterial({ color: 0xef00ab,side: THREE.DoubleSide,  opacity: 0.3, transparent: true });

    var meshy = new THREE.Mesh(pg, pm);
    let v1 = calculateNormals(meshy);
    v1.normalize();
    var axis = v1.clone().cross(uvector);
    axis.normalize();
    var angle = Math.acos(v1.clone().dot(uvector));
    let rotationWorldMatrix = new THREE.Matrix4();
    rotationWorldMatrix.makeRotationAxis(axis, angle);
    meshy.matrix.multiply(rotationWorldMatrix);
    meshy.rotation.setFromRotationMatrix(meshy.matrix);
    //Remove userdata dependency
    meshy.userData = { x: uvector.x, y: uvector.y, z: uvector.z, lockX: false, lockY: false, lockZ: false, parent: "" };
    meshy.position.set(spherepos.x, spherepos.y, spherepos.z);
    if (PlaneName == undefined)
        meshy.name = "plane";
    else
        meshy.name = PlaneName;
    scene.add(meshy);
}
function calculateNormals(mesh, pos) {
    let cameraVector;
    if (undefined == pos)
        cameraVector = (new THREE.Vector3(0, 0, -1)).applyQuaternion(camera.quaternion);
    else {
        pos.negate();
        cameraVector = pos;
    }
    var normalMatrix = new THREE.Matrix3();
    var worldNormal = new THREE.Vector3();
    normalMatrix.getNormalMatrix(mesh.matrixWorld);
    let normal = new THREE.Vector3(0, 0, 1);
    worldNormal.copy(normal).applyMatrix3(normalMatrix).normalize();
    if (worldNormal.angleTo(cameraVector) > Math.PI / 2) {
        return worldNormal;
    }
    else {
        return worldNormal.negate();
    }
}
function isAnyRadioButtonChecked() {
    const radioButtons = document.querySelectorAll('input[name="landmark"]');
    for (let radio of radioButtons) {
        if (radio.checked) {
            return true;
        }
    }
    return false;
}

function ProjectEpicondlyeAxisOnDistalPlane() {
    let obj = scene.getObjectByName("Projected Epicondyle Axis", true);
    if (undefined != obj)
        scene.remove(obj);
    let epicondyleAxis = scene.getObjectByName("TEA-Trans Epicondyle Axis", true);

    let axialPlane = scene.getObjectByName("Axial Plane", true);
    if (undefined == epicondyleAxis || undefined == axialPlane)
        return;
    axialPlane.updateMatrixWorld();
    ProjectLineOnPlane(epicondyleAxis, axialPlane, "Projected Epicondyle Axis");    
}
function ProjectEpicondlyeAxisOnVarusValgusPlane() {
    let obj = scene.getObjectByName("Projected Epicondyle Axis_VarusValgus", true);
    if (undefined != obj)
        scene.remove(obj);
    let epicondyleAxis = scene.getObjectByName("TEA-Trans Epicondyle Axis", true);

    let axialPlane = scene.getObjectByName("Varus-Valgus Plane", true);
    if (undefined == epicondyleAxis || undefined == axialPlane)
        return;
    axialPlane.updateMatrixWorld();
    ProjectLineOnPlane(epicondyleAxis, axialPlane, "Projected Epicondyle Axis_VarusValgus");    
}
function ProjectLineOnPlane(epicondyleAxis, axialPlane, TempAxisName) {
    // let obj = scene.getObjectByName("ProjectedPoint1", true);
    // if (undefined != obj)
    //     scene.remove(obj);
    // obj = scene.getObjectByName("ProjectedPoint2", true);
    // if (undefined != obj)
    //     scene.remove(obj);
    // obj = scene.getObjectByName("ProjectedFemurCent", true);
    // if (undefined != obj)
    //     scene.remove(obj);

    let twopointsinarray = epicondyleAxis.geometry.attributes.position.array;

    let firstpoint = new THREE.Vector3(twopointsinarray[0], twopointsinarray[1], twopointsinarray[2]);
    let secondpoint = new THREE.Vector3(twopointsinarray[3], twopointsinarray[4], twopointsinarray[5]);


    let nrm = calculateNormals(axialPlane);
    nrm.normalize();
    let projectedfirstpt = new THREE.Vector3();
    let projectedsecondpt = new THREE.Vector3();
    let plane = new THREE.Plane();
    plane.setFromNormalAndCoplanarPoint(nrm, axialPlane.position.clone());
    plane.projectPoint(firstpoint, projectedfirstpt);
    plane.projectPoint(secondpoint, projectedsecondpt);

    let femurCent= scene.getObjectByName("Femur Center", true)
    let projectedMidPt = new THREE.Vector3();
    plane.projectPoint(femurCent, projectedMidPt);
    // CreateSphereGeometrywithpoint(projectedfirstpt, "ProjectedPoint1");
    // CreateSphereGeometrywithpoint(projectedsecondpt, "ProjectedPoint2");
    // CreateSphereGeometrywithpoint(projectedMidPt, "ProjectedFemurCent");
    removeTransformControls()
    //joining these two points to create a line
    CreateProjectedLine(projectedfirstpt, projectedsecondpt, TempAxisName);

}
function CreateProjectedLine(point1, point2, TempAxisName) {
    const material = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 10 });
    let pointsposition = [point1, point2]
    const geometry = new THREE.BufferGeometry().setFromPoints(pointsposition);
    const line = new THREE.Line(geometry, material);
    if (undefined == TempAxisName)
        line.name = "Projected Line";
    else
        line.name = TempAxisName;
    scene.add(line);
}
function CreateAnteriorLine() {
    let obj = scene.getObjectByName("Temp Epicondyle axis", true);
    if (undefined != obj)
        scene.remove(obj);

    obj = scene.getObjectByName("Anterior Line", true);
    if (undefined != obj)
        scene.remove(obj);

    let projectedepicondyleaxis = scene.getObjectByName("Projected Epicondyle Axis", true);
    let initialpt = scene.getObjectByName("Femur Center", true);
    let MechAxisObject = scene.getObjectByName("Mechanical Axis", true);
    if (undefined == projectedepicondyleaxis || undefined == initialpt || undefined == MechAxisObject)
        return;
    var SaggAxisArraypts = projectedepicondyleaxis.geometry.attributes.position.array;

    var sagaxis = new THREE.Vector3(SaggAxisArraypts[3] - SaggAxisArraypts[0], SaggAxisArraypts[4] - SaggAxisArraypts[1], SaggAxisArraypts[5] - SaggAxisArraypts[2]);
    sagaxis.normalize();
    linepoints[1] = initialpt.position.clone();
    linepoints[0] = initialpt.position.clone().add(sagaxis.clone().multiplyScalar(15));
    //Creation of temp axis perpendicular to the epicondyle axis
    var SaggAxisArraypts = MechAxisObject.geometry.attributes.position.array;
    // var Mechaxis = new THREE.Vector3(SaggAxisArraypts[0] - SaggAxisArraypts[3], SaggAxisArraypts[1] - SaggAxisArraypts[4], SaggAxisArraypts[2] - SaggAxisArraypts[5]);
    var Mechaxis = new THREE.Vector3(SaggAxisArraypts[3] - SaggAxisArraypts[0], SaggAxisArraypts[4] - SaggAxisArraypts[1], SaggAxisArraypts[5] - SaggAxisArraypts[2]);
    Mechaxis.normalize();

    let tempcoronalaxis =Mechaxis.clone().cross(sagaxis);
    tempcoronalaxis.normalize();

    linepoints[0] = initialpt.position.clone();
    linepoints[1] = initialpt.position.clone().add(tempcoronalaxis.clone().multiplyScalar(10));// new THREE.Vector3(SaggAxisArraypts[3], SaggAxisArraypts[4], SaggAxisArraypts[5]);
    CreateLine("Anterior Line");

}
 // temp coronal axis is Anterior line so far I can understand and distal plane is Axial plane
function CreateVarusValgusAngle(value) {
    let varusValgusPlane = scene.getObjectByName("Varus-Valgus Plane")
    if (undefined != varusValgusPlane)
        scene.remove(varusValgusPlane);
    let anteriorLine = scene.getObjectByName("Anterior Line", true);
    if (undefined == anteriorLine) {
        return;
    }
    let tempAnteriorLine = scene.getObjectByName("Temp Anterior Line", true);
    if (undefined != tempAnteriorLine)
        scene.remove(tempAnteriorLine);
    let axialPlane = scene.getObjectByName("Axial Plane", true);
    if (undefined == axialPlane) {
        return;
    }  
    let geometry = new THREE.PlaneGeometry(100, 100);
    let material = axialPlane.material.clone();
    material.color.set(0x00ff00); 
    let tempAxialPlane = new THREE.Mesh(geometry, material);
    tempAxialPlane.rotation.copy(axialPlane.rotation);
    tempAxialPlane.name = "Varus-Valgus Plane";
    tempAxialPlane.position.copy(axialPlane.position);
    scene.add(tempAxialPlane);
    let arr = anteriorLine.geometry.attributes.position.array;
    let v1 = new THREE.Vector3(arr[0] - arr[3], arr[1] - arr[4], arr[2] - arr[5]);
    v1.normalize();
    anteriorLine.name="Temp Anterior line";
    let angle;
    if(value != undefined){
        angle = value
    }
    else{
        angle = 3
    }
    tempAxialPlane.rotateOnWorldAxis(v1, THREE.Math.degToRad(value));
    ProjectEpicondlyeAxisOnVarusValgusPlane();
    CreateAnteriorLine();

}
function CreateFlexionPlane(value){
    let FlexionExtension = scene.getObjectByName("Flexion_Extension Plane")
    if (undefined != FlexionExtension)
        scene.remove(FlexionExtension);
    let HorzontalLine = scene.getObjectByName("Lateral Line", true);
    let HorizontalLineArray = HorzontalLine.geometry.attributes.position.array;
    let HorzontalAxis = new THREE.Vector3(HorizontalLineArray[3] - HorizontalLineArray[0], HorizontalLineArray[4] - HorizontalLineArray[1], HorizontalLineArray[5] - HorizontalLineArray[2]);
    HorzontalAxis.normalize(); 
    let AxialPlane = scene.getObjectByName("Varus-Valgus Plane", true);
    let flexioPlaneMaterial = AxialPlane.material.clone();
    flexioPlaneMaterial.color.set(0x0000ff); 
    let flexioPlaneGeom;
    if (AxialPlane.geometry.type == "PlaneGeometry")
    flexioPlaneGeom = new THREE.PlaneGeometry(100, 100);
    let FlexionPlane = new THREE.Mesh(flexioPlaneGeom, flexioPlaneMaterial);
    FlexionPlane.rotation.copy(AxialPlane.rotation);
    FlexionPlane.name = "Flexion_Extension Plane";

    FlexionPlane.position.set(AxialPlane.position.x, AxialPlane.position.y, AxialPlane.position.z);
    let angle;
    if(value != undefined){
        angle = value
    }
    else{
        angle = 3
    }
    FlexionPlane.rotateOnWorldAxis(HorzontalAxis, THREE.Math.degToRad(value));
    scene.add(FlexionPlane);
}
let varusValue = 0;
    document.getElementById('increase-varus').addEventListener('click', function() {
        varusValue++;
        document.getElementById('value-varus').textContent = varusValue;
        CreateVarusValgusAngle(varusValue)
    });

    document.getElementById('decrease-varus').addEventListener('click', function() {
        varusValue--;
        document.getElementById('value-varus').textContent = varusValue;
        CreateVarusValgusAngle(varusValue)
    });

    let flexionValue = 0;
    document.getElementById('increase-flexion').addEventListener('click', function() {
        flexionValue++;
        document.getElementById('value-flexion').textContent = flexionValue;
        CreateFlexionPlane(flexionValue)
    });

    document.getElementById('decrease-flexion').addEventListener('click', function() {
        flexionValue--;
        document.getElementById('value-flexion').textContent = flexionValue;
        CreateFlexionPlane(flexionValue)
    });




























export default LoadModels;
