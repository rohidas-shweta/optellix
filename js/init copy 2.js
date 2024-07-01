
import * as THREE from '../build/three.module.js';
import { STLLoader } from './jsm/loader/STLLoader.js';
import { TrackballControls } from './jsm/controls/TrackballControls.js';
import { TransformControls } from './TransformControls.js';
import { STLExporter } from './STLExporter.js';
import { ThreeBSP } from './ThreeCSG.js'

//import {ThreeBSP} from './ThreeCSG.js';
//import FS from './fs.js';

//Global variables 
let camera, renderer;
let scene;
let container;
let controls, transformControl;
let select = true;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(1, 1);
let group, hiddengroup, implantgroup;
let stats, statsupdated = false;
let currentmesh, selectedObject;
let xaxisrotation, yaxisrotation, zaxisrotation;
//for threepoint selection
let firstpt, secondpt, thirdpt;
let Planearray = [];
let planeObjects;
var showhideGroup = new THREE.Group();

let once = true;
const templateoptions = Object.freeze({
    "NONE": 0, "MECH_TEA": 1, "MECH_POSTERIOR_TEA": 2, "ANAT_TEA": 3, "ANAT_POSTERIOR_TEA": 4
});
let template = templateoptions.NONE;

const options = Object.freeze({
    "NONE": 0, "POINT": 1, "POINTSELECT": 2, "LINE": 3, "PLANE": 4, "SELECTION": 5,
    "LINESELECTION": 6, "STLSELECTION": 7, "GETNORMAL": 8, "PARALLEL": 9, "PROJECTLINEONPLANE": 10,
    "MAKEPARALLEL": 11, "MAKEPERPENDICULAR": 12, "DRAWPOINT": 13, "INVERTDIRECTION": 14, "COINCIDENTPLANE": 15,
    "NORMALTOPLANE": 16, "GROUPTOGETHER": 17, "MIDPOINT": 18, "PLANEUSING3POINTS": 19, "TESTQUATERNION": 20,
    "PROJECTPOINTSONPLANE": 21, "CALULATEROTATION": 22, "LOCK": 23, "TRANSLATEAXIS": 24, "CREATEDISTALDEFLECTIONPLANE": 25,
    "MEASURE": 26, "TRANSLATE10MM": 27, "POINTSELECTFORTIBIA": 28
});

const pointselectednum = Object.freeze({ "FIRSTPOINTSELECTED": 1, "SECONDPOINTSELECTED": 2, "THIRDPOINTSELECTED": 3 });
const workingaxis = Object.freeze({ "ALLAXES": 0, "XAXIS": 1, "YAXIS": 2, "ZAXIS": 3 });
const selectionon = Object.freeze({ "NONE": 0, "ENTITY": 1, "GROUP": 2 });

let DrawGeometry = options.NONE;
let pointnum = pointselectednum.FIRSTPOINTSELECTED;
let axis = workingaxis.XAXIS;
let selectedent = selectionon.NONE;
let POINTS = [];
let firstpointselected = true, firstlineselected = true, firstplaneselected = true, firstObjectSelected = true;
let prevmesh;//for hover mesh
var linepoints = [2];
let orthoCamera, defcam;
let CAPS = {};


var Tree = $("#jstree_demo_div");
init();
animate();
window.addEventListener("resize", Resize);
function Resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
}

function DeleteLinesAndPlanes() {
    //Remove Mechanical Axis
    let mechaxis = scene.getObjectByName("Mechanical Axis", true);
    if (undefined != mechaxis)
        scene.remove(mechaxis);

    let Epicondyleaxis = scene.getObjectByName("Epicondyle Axis", true);
    if (undefined != Epicondyleaxis)
        scene.remove(Epicondyleaxis);

    let projectedepicondyleaxis = scene.getObjectByName("Projected Epicondyle Axis");
    if (undefined != projectedepicondyleaxis)
        scene.remove(projectedepicondyleaxis);

    let UpdatedDistalPlane = scene.getObjectByName("5Â° Ext - perp-to-TEA ref for rotation", true);
    if (undefined != UpdatedDistalPlane)
        scene.remove(UpdatedDistalPlane);

    let DistalPlane = scene.getObjectByName("Axial - Mech Axis - Rod inst", true);
    if (undefined != DistalPlane)
        scene.remove(DistalPlane);

    DistalPlane = scene.getObjectByName("Normal to Anat Axis", true);
    if (undefined != DistalPlane)
        scene.remove(DistalPlane);

    let SagittalPlane = scene.getObjectByName("Mech - TEA Sagittal", true);
    if (undefined != SagittalPlane)
        scene.remove(SagittalPlane);

    SagittalPlane = scene.getObjectByName("Mech - Post Cond Sagittal", true);
    if (undefined != SagittalPlane)
        scene.remove(SagittalPlane);

    let CoronalPlane = scene.getObjectByName("Mech - TEA Coronal", true);
    if (undefined != CoronalPlane)
        scene.remove(CoronalPlane);

    CoronalPlane = scene.getObjectByName("Mech - Post Cond Coronal", true);
    if (undefined != CoronalPlane)
        scene.remove(CoronalPlane);

    SagittalPlane = scene.getObjectByName("Anat - TEA Sagittal", true);
    if (undefined != SagittalPlane)
        scene.remove(SagittalPlane);

    SagittalPlane = scene.getObjectByName("Anat - Post Cond Sagittal", true);
    if (undefined != SagittalPlane)
        scene.remove(SagittalPlane);

    CoronalPlane = scene.getObjectByName("Anat - TEA Coronal", true);
    if (undefined != CoronalPlane)
        scene.remove(CoronalPlane);

    CoronalPlane = scene.getObjectByName("Anat - Post Cond Coronal", true);
    if (undefined != CoronalPlane)
        scene.remove(CoronalPlane);

    let MechFlexionAdjustPlane = scene.getObjectByName("Mech Flexion Adjust Plane", true);
    if (undefined != MechFlexionAdjustPlane)
        scene.remove(MechFlexionAdjustPlane);

    MechFlexionAdjustPlane = scene.getObjectByName("Anat Flexion Adjust Plane", true);
    if (undefined != MechFlexionAdjustPlane)
        scene.remove(MechFlexionAdjustPlane);

    let AxialRodInstAtDistalMedialPtPlane = scene.getObjectByName("Axial - Rod inst at Distal Medial Pt", true);
    if (undefined != AxialRodInstAtDistalMedialPtPlane)
        scene.remove(AxialRodInstAtDistalMedialPtPlane);

    AxialRodInstAtDistalMedialPtPlane = scene.getObjectByName("Axial at Distal Med Extent", true);
    if (undefined != AxialRodInstAtDistalMedialPtPlane)
        scene.remove(AxialRodInstAtDistalMedialPtPlane);

    let MechDistalResectPlane = scene.getObjectByName("Mech Distal Resect Plane - 10mm", true);
    if (undefined != MechDistalResectPlane)
        scene.remove(MechDistalResectPlane);

    MechDistalResectPlane = scene.getObjectByName("Anat Distal Resect Plane - 10mm", true);
    if (undefined != MechDistalResectPlane)
        scene.remove(MechDistalResectPlane);

    // let distalcutplane = scene.getObjectByName("Distal Cut Plane", true);
    // if (undefined != distalcutplane)
    //     scene.remove(distalcutplane);
    // let Sagittalcutplane = scene.getObjectByName("Sagittal Cut Plane", true);
    // if (undefined != Sagittalcutplane)
    //     scene.remove(Sagittalcutplane);
    // let coronalcutplane = scene.getObjectByName("Coronal Cut Plane", true);
    // if (undefined != coronalcutplane)
    //     scene.remove(coronalcutplane);

    scene.updateMatrixWorld(true);
}
// document.getElementById("RangeForImplant").onchange = function (e) {
//     let implant = scene.getObjectByName("Implant", true);
//     if (undefined != implant) {
//         implant.material.opacity = this.value / 100;
//     }
// }

// document.getElementById("RangeForBone").onchange = function (e) {
//     if (undefined == group)
//         return;

//     if (group.children.length > 0) {
//         for (let i = 0; i < group.children.length; i++) {
//             group.children[i].material.opacity = this.value / 100;
//         }
//     }

// }
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
    else if ("Orthographic" == getvalue) {
        if (camera.type == "OrthographicCamera")
            return;
        let cTarget = controls.target;
        defcam = camera;
        updateOrthoCamera();
        camera = orthoCamera;
        CreateTrackballControls();
        CreateTransformControls();
        controls.target.set(cTarget.x, cTarget.y, cTarget.z);
        camera.lookAt(cTarget);
    }
    else if ("Isometric" == getvalue) {
        if (camera.type == "PerspectiveCamera")
            return;
        let cTarget = controls.target;
        orthoCamera = camera;
        updateDefCamera();
        camera = defcam;
        CreateTrackballControls();
        CreateTransformControls();
        controls.target.set(cTarget.x, cTarget.y, cTarget.z);
        camera.lookAt(cTarget);
    }
}
function updateDefCamera() {
    defcam.position.copy(camera.position);
    defcam.rotation.copy(camera.rotation);
    defcam.updateProjectionMatrix();
}

function updateOrthoCamera() {

    const size = controls.target.distanceTo(camera.position);
    const aspect = camera.aspect;

    orthoCamera.left = size * aspect / - 2;
    orthoCamera.right = size * aspect / 2;

    orthoCamera.top = size / 2;
    orthoCamera.bottom = size / - 2;
    orthoCamera.position.copy(camera.position);
    orthoCamera.rotation.copy(camera.rotation);
    orthoCamera.updateProjectionMatrix();

}

// document.getElementById("MeshCopy").onclick = function (e) {
//     if (undefined == currentmesh)
//         return;
//     let newMesh;

//     if (currentmesh.geometry.type == "SphereGeometry") {
//         let geometry = new THREE.sphereGeometry();
//     }
//     if (currentmesh.geometry.type == "PlaneGeometry") {
//         let geometry = new THREE.PlaneGeometry(100, 100);
//         let material = currentmesh.material.clone();
//         newMesh = new THREE.Mesh(geometry, material);
//         newMesh.rotation.copy(currentmesh.rotation);
//         newMesh.position.copy(currentmesh.position);
//         scene.add(newMesh);
//     }
//     transformControl.attach(newMesh);
// }

// document.getElementById("Ext to Post").onchange = function (e) {
//     if (template == templateoptions.MECH_TEA || template == templateoptions.ANAT_TEA)
//         return;
//     let MechAxisObject = scene.getObjectByName("Mechanical Axis", true);
//     if (undefined == MechAxisObject)
//         return;

//     let projectedepicondyleaxis = scene.getObjectByName("Projected Epicondyle Axis");
//     if (undefined == projectedepicondyleaxis)
//         return;

//     let rodInsertpt = scene.getObjectByName("Rod Insertion Pt", true);
//     if (undefined == rodInsertpt)
//         return;

//     let Temmpepicondyleaxis = scene.getObjectByName("Temp Epicondyle axis", true);
//     if (undefined != Temmpepicondyleaxis)
//         scene.remove(Temmpepicondyleaxis);

//     let arr = projectedepicondyleaxis.geometry.attributes.position.array;
//     let frompoint = new THREE.Vector3(arr[0], arr[1], arr[2]);
//     let topoint = new THREE.Vector3(arr[3], arr[4], arr[5]);
//     let projectedepicondyleaxisvector = frompoint.clone().sub(topoint);
//     projectedepicondyleaxisvector.normalize();

//     arr = MechAxisObject.geometry.attributes.position.array;
//     frompoint = new THREE.Vector3(arr[0], arr[1], arr[2]);
//     topoint = new THREE.Vector3(arr[3], arr[4], arr[5]);
//     let MechanicalAxisVector = frompoint.clone().sub(topoint);
//     MechanicalAxisVector.normalize();
//     projectedepicondyleaxisvector.applyAxisAngle(MechanicalAxisVector, THREE.Math.degToRad(document.getElementById("Ext to Post").value));
//     if (undefined == implantgroup)
//         implantgroup.rotateOnWorldAxis(MechanicalAxisVector, THREE.Math.degToRad(document.getElementById("Ext to Post").value));
//     projectedepicondyleaxisvector.normalize();
//     let newpt = rodInsertpt.position.clone();
//     let temp = projectedepicondyleaxisvector.clone().multiplyScalar(15);
//     let secondnewpt = newpt.clone().add(temp);
//     linepoints[0] = newpt;
//     linepoints[1] = secondnewpt;
//     CreateLine("Temp Epicondyle axis");
//     CreateSagittalAndCoronalPlane("Temp Epicondyle axis");
// }

// document.getElementById("Translation").onchange = function (e) {
//     let RodInstDistMedialPlane, MechDistalResectPlane;
//     if (templateoptions.MECH_TEA == template || templateoptions.MECH_POSTERIOR_TEA == template) {

//         RodInstDistMedialPlane = scene.getObjectByName("Axial - Rod inst at Distal Medial Pt", true);
//         if (undefined == RodInstDistMedialPlane)
//             return;

//         MechDistalResectPlane = scene.getObjectByName("Mech Distal Resect Plane - 10mm", true);
//         if (undefined == MechDistalResectPlane)
//             return;
//     } else if (templateoptions.ANAT_TEA == template || templateoptions.ANAT_POSTERIOR_TEA == template) {
//         RodInstDistMedialPlane = scene.getObjectByName("Axial at Distal Med Extent", true);
//         if (undefined == RodInstDistMedialPlane)
//             return;

//         MechDistalResectPlane = scene.getObjectByName("Anat Distal Resect Plane - 10mm", true);
//         if (undefined == MechDistalResectPlane)
//             return;
//     }
//     let translateaxis = MechDistalResectPlane.position.clone().sub(RodInstDistMedialPlane.position.clone());
//     translateaxis.normalize();
//     MechDistalResectPlane.position.set(RodInstDistMedialPlane.position.x, RodInstDistMedialPlane.position.y, RodInstDistMedialPlane.position.z);
//     let dist = document.getElementById("Translation").value;
//     if (dist == 0)
//         dist = 0.1;
//     let newpt = RodInstDistMedialPlane.position.clone().add(translateaxis.multiplyScalar(dist));
//     MechDistalResectPlane.position.set(newpt.x, newpt.y, newpt.z);
//     if (undefined == implantgroup)
//         return;
//     implantgroup.position.set(newpt.x, newpt.y, newpt.z);
// }

function DeleteDerivedPlanes() {

    let SagittalPlane = scene.getObjectByName("Mech - TEA Sagittal", true);
    if (undefined != SagittalPlane) {
        scene.remove(SagittalPlane);
    }
    SagittalPlane = scene.getObjectByName("Anat - TEA Sagittal", true);
    if (undefined != SagittalPlane) {
        scene.remove(SagittalPlane);
    }

    let CoronalPlane = scene.getObjectByName("Mech - TEA Coronal", true);
    if (undefined != CoronalPlane) {
        scene.remove(CoronalPlane);
    }
    CoronalPlane = scene.getObjectByName("Anat - TEA Coronal", true);
    if (undefined != CoronalPlane) {
        scene.remove(CoronalPlane);
    }

    let MechFlexionAdjustPlane = scene.getObjectByName("Mech Flexion Adjust Plane", true);
    if (undefined != MechFlexionAdjustPlane) {
        scene.remove(MechFlexionAdjustPlane);
    }

    MechFlexionAdjustPlane = scene.getObjectByName("Anat Flexion Adjust Plane", true);
    if (undefined != MechFlexionAdjustPlane) {
        scene.remove(MechFlexionAdjustPlane);
    }

    // let AxialRodInstAtDistalMedialPtPlane = scene.getObjectByName("Axial - Rod inst at Distal Medial Pt", true);
    // if (undefined != AxialRodInstAtDistalMedialPtPlane) {
    //     scene.remove(AxialRodInstAtDistalMedialPtPlane);
    // }

    let MechDistalResectPlane = scene.getObjectByName("Mech Distal Resect Plane - 10mm", true);
    if (undefined != MechDistalResectPlane) {
        scene.remove(MechDistalResectPlane);
    }
    MechDistalResectPlane = scene.getObjectByName("Anat Distal Resect Plane - 10mm", true);
    if (undefined != MechDistalResectPlane) {
        scene.remove(MechDistalResectPlane);
    }
}

// document.getElementById("Varus-valgus").onchange = function (e) {

//     CreateVarusValgusAngle(document.getElementById("Varus-valgus").value);
//     CreateSagittalAndCoronalPlane();
//     CreateflexionandAssociatedPlanes();
//     return;
//     let tempcoronalaxis = scene.getObjectByName("Mech Temp Coronal axis", true);
//     if (undefined == tempcoronalaxis) {
//         return;
//     }
//     let distalplane = scene.getObjectByName("Normal to Anat Axis", true);
//     if (undefined == distalplane) {

//         distalplane = scene.getObjectByName("Axial - Mech Axis - Rod inst", true);
//         if (undefined == distalplane) {
//             return;
//         }
//     }

//     let distalplane5degext = scene.getObjectByName("5Â° Ext - perp-to-TEA ref for rotation", true);
//     if (undefined == distalplane) {
//         return;
//     }

//     let nrm1 = calculateNormals(distalplane);
//     let nrm2 = calculateNormals(distalplane5degext);
//     let axis = nrm1.clone().cross(nrm2.clone());
//     axis.normalize();
//     let angle = nrm1.clone().angleTo(nrm2);

//     let arr = tempcoronalaxis.geometry.attributes.position.array;
//     let v1 = new THREE.Vector3(arr[0] - arr[3], arr[1] - arr[4], arr[2] - arr[5]);
//     v1.normalize();
//     distalplane5degext.rotateOnWorldAxis(axis, -angle);
//     angle = THREE.Math.degToRad(document.getElementById("Varus-valgus").value);
//     distalplane5degext.rotateOnWorldAxis(v1, angle);;
//     DeleteDerivedPlanes();
//     ProjectEpicondlyeAxisOnDistalPlane();
//     CreateInterNalCoordinateForSagittalAndCoronalPlane();
//     CreateSagittalAndCoronalPlane();
//     CreateflexionandAssociatedPlanes();
//     //AffixImplantPlanesWithDerivedPlanes();
// }

// document.getElementById("Flexion").onchange = function (e) {

//     let DistalPlane, FlexionAdjustPlane, RodInstDistMedialPlane, MechDistalResectPlane;
//     // DistalPlane = scene.getObjectByName("5Â° Ext - perp-to-TEA ref for rotation", true);
//     // if (undefined == DistalPlane)
//     //     return;

//     if (templateoptions.MECH_TEA == template || templateoptions.MECH_POSTERIOR_TEA == template) {

//         DistalPlane = scene.getObjectByName("5Â° Ext - perp-to-TEA ref for rotation", true);
//         if (undefined == DistalPlane)
//             return;
//         FlexionAdjustPlane = scene.getObjectByName("Mech Flexion Adjust Plane", true);
//         if (undefined == FlexionAdjustPlane)
//             return;
//         RodInstDistMedialPlane = scene.getObjectByName("Axial - Rod inst at Distal Medial Pt", true);
//         if (undefined != RodInstDistMedialPlane)
//             scene.remove(RodInstDistMedialPlane);
//         MechDistalResectPlane = scene.getObjectByName("Mech Distal Resect Plane - 10mm", true);
//         if (undefined != MechDistalResectPlane)
//             scene.remove(MechDistalResectPlane);
//     }
//     else if (templateoptions.ANAT_TEA == template || templateoptions.ANAT_POSTERIOR_TEA == template) {
//         DistalPlane = scene.getObjectByName("5Â° Ext - perp-to-TEA ref for rotation", true);
//         if (undefined == DistalPlane)
//             return;
//         FlexionAdjustPlane = scene.getObjectByName("Anat Flexion Adjust Plane", true);
//         if (undefined == FlexionAdjustPlane)
//             return;
//         RodInstDistMedialPlane = scene.getObjectByName("Axial at Distal Med Extent", true);
//         if (undefined != RodInstDistMedialPlane)
//             scene.remove(RodInstDistMedialPlane);
//         MechDistalResectPlane = scene.getObjectByName("Anat Distal Resect Plane - 10mm", true);
//         if (undefined != MechDistalResectPlane)
//             scene.remove(MechDistalResectPlane);
//     }



//     // DistalPlane = scene.getObjectByName("5Â° Ext - perp-to-TEA ref for rotation", true);
//     // if (undefined == DistalPlane)
//     //     DistalPlane = scene.getObjectByName("Axial - Mech Axis - Rod inst", true);
//     // if (undefined == DistalPlane)
//     //     return;
//     // let FlexionAdjustPlane = scene.getObjectByName("Mech Flexion Adjust Plane", true);
//     // if (undefined == FlexionAdjustPlane)
//     //     return;
//     // let RodInstDistMedialPlane = scene.getObjectByName("Axial - Rod inst at Distal Medial Pt", true);
//     // if (undefined != RodInstDistMedialPlane)
//     //     scene.remove(RodInstDistMedialPlane);
//     // let MechDistalResectPlane = scene.getObjectByName("Mech Distal Resect Plane - 10mm", true);
//     // if (undefined != MechDistalResectPlane)
//     //     scene.remove(MechDistalResectPlane);

//     let tempepicondyleaxis;

//     tempepicondyleaxis = scene.getObjectByName("Temp Epicondyle axis");
//     if (undefined == tempepicondyleaxis)
//         return;

//     let arr = tempepicondyleaxis.geometry.attributes.position.array;
//     let v1 = new THREE.Vector3(arr[0] - arr[3], arr[1] - arr[4], arr[2] - arr[5]);
//     v1.normalize();

//     let nrm1 = calculateNormals(DistalPlane);
//     let nrm2 = calculateNormals(FlexionAdjustPlane);
//     let axis = nrm1.clone().cross(nrm2.clone());
//     let originalangle = nrm1.angleTo(nrm2);
//     axis.normalize();
//     FlexionAdjustPlane.rotateOnWorldAxis(axis.clone(), -originalangle);
//     // RodInstDistMedialPlane.rotateOnWorldAxis(axis.clone(), -originalangle);
//     // MechDistalResectPlane.rotateOnWorldAxis(axis.clone(), -originalangle);

//     let angle = eval(document.getElementById("Flexion").value);
//     if (angle > 5) {
//         alert("Max angle can be 5 degree");
//         angle = 5;
//         document.getElementById("Flexion").value = angle;
//     }
//     angle = THREE.Math.degToRad(angle);

//     FlexionAdjustPlane.rotateOnWorldAxis(v1.clone(), angle);
//     CreateAxialRodInstDistalMedialPlane(FlexionAdjustPlane);
//     if (undefined == implantgroup)
//         return;
//     implantgroup.rotateOnWorldAxis(axis.clone(), -originalangle);
//     implantgroup.rotateOnWorldAxis(v1.clone(), angle);
//     return;
// }

// document.getElementById("Measure").onclick = function (e) {
//     DrawGeometry = options.MEASURE;
// }

function AffixImplantPlanesWithDerivedPlanes() {
    let SagittalCutPlane = scene.getObjectByName("Sagittal Cut Plane", true);
    let DistalCutPlane = scene.getObjectByName("Distal Cut Plane", true);

    let SagittalPlane, MechDistalResectPlane;
    if (templateoptions.MECH_TEA == template) {
        SagittalPlane = scene.getObjectByName("Mech - TEA Sagittal", true);
        MechDistalResectPlane = scene.getObjectByName("Mech Distal Resect Plane - 10mm", true);
    }
    else if (templateoptions.MECH_POSTERIOR_TEA == template) {
        SagittalPlane = scene.getObjectByName("Mech - Post Cond Sagittal", true);
        MechDistalResectPlane = scene.getObjectByName("Mech Distal Resect Plane - 10mm", true);
    }
    else if (templateoptions.ANAT_POSTERIOR_TEA == template) {
        SagittalPlane = scene.getObjectByName("Anat - Post Cond Sagittal", true);
        MechDistalResectPlane = scene.getObjectByName("Anat Distal Resect Plane - 10mm", true);
    }
    else if (templateoptions.ANAT_TEA == template) {
        SagittalPlane = scene.getObjectByName("Anat - TEA Sagittal", true);
        MechDistalResectPlane = scene.getObjectByName("Anat Distal Resect Plane - 10mm", true);
    }

    if (undefined == SagittalCutPlane || undefined == SagittalPlane || undefined == DistalCutPlane || undefined == MechDistalResectPlane)
        return;
    //1st plane
    let nrm1 = calculateNormals(SagittalPlane);
    let nrm2 = calculateNormals(SagittalCutPlane);
    let rotationaxis = nrm1.clone().cross(nrm2.clone());
    rotationaxis.normalize();
    let angle = nrm1.clone().angleTo(nrm2.clone());
    if (angle < Math.PI / 2) {
        // fixing the implants sagittal planes together 
        implantgroup.rotateOnWorldAxis(rotationaxis, -angle);
    }
    else {
        implantgroup.rotateOnWorldAxis(rotationaxis, Math.PI - angle);
    }

    implantgroup.updateMatrixWorld();
    //2nd plane
    nrm1 = calculateNormals(MechDistalResectPlane);
    nrm2 = calculateNormals(DistalCutPlane);
    rotationaxis = nrm1.clone().cross(nrm2.clone());
    rotationaxis.normalize();
    angle = nrm1.clone().angleTo(nrm2.clone());

    if (angle < Math.PI / 2) {
        // fixing the implants sagittal planes together 
        implantgroup.rotateOnWorldAxis(rotationaxis, -angle);
    }
    else {
        implantgroup.rotateOnWorldAxis(rotationaxis, Math.PI - angle);
    }
    implantgroup.position.copy(MechDistalResectPlane.position);
    return;
}

// document.getElementById("Finalfix").onclick = function (e) {
//     AffixImplantPlanesWithDerivedPlanes();
// }

function CreateflexionandAssociatedPlanes() {
    transformControl.setSpace("local");
    let DistalPlane;
    DistalPlane = scene.getObjectByName("5Â° Ext - perp-to-TEA ref for rotation", true);
    if (undefined == DistalPlane)
        DistalPlane = scene.getObjectByName("Axial - Mech Axis - Rod inst", true);
    if (undefined == DistalPlane)
        return;

    let projectedepicondyleaxis = scene.getObjectByName("Temp Epicondyle axis");
    if (undefined == projectedepicondyleaxis)
        return;
    let arr = projectedepicondyleaxis.geometry.attributes.position.array;

    let rotationaxis = new THREE.Vector3(arr[3] - arr[0], arr[4] - arr[1], arr[5] - arr[2]);
    rotationaxis.normalize();
    let newobjectmaterial = DistalPlane.material.clone();
    let newgeom = new THREE.PlaneGeometry(100, 100);

    //creating 1st flexion plane
    let newObject = new THREE.Mesh(newgeom, newobjectmaterial);
    newObject.rotation.copy(DistalPlane.rotation);


    if (template == templateoptions.MECH_TEA || template == templateoptions.MECH_POSTERIOR_TEA) {
        let obj = scene.getObjectByName("Mech Flexion Adjust Plane");
        if (undefined != obj)
            scene.remove(obj);
        newObject.name = "Mech Flexion Adjust Plane";
    }
    if (template == templateoptions.ANAT_TEA || template == templateoptions.ANAT_POSTERIOR_TEA) {
        let obj = scene.getObjectByName("Anat Flexion Adjust Plane");
        if (undefined != obj)
            scene.remove(obj);
        newObject.name = "Anat Flexion Adjust Plane";
    }

    newObject.position.set(DistalPlane.position.x, DistalPlane.position.y, DistalPlane.position.z);
    newObject.rotateOnWorldAxis(rotationaxis, THREE.Math.degToRad(0.0));
    scene.add(newObject);
    AddParentForJSTREE(newObject);
    newObject.updateMatrixWorld(true);
    //creating second flexion plane
    CreateAxialRodInstDistalMedialPlane(newObject);
}

function CreateAxialRodInstDistalMedialPlane(newObject) {


    let newgeom = new THREE.PlaneGeometry(100, 100);
    let newobjectmaterial = newObject.material.clone();

    let newObject1 = new THREE.Mesh(newgeom, newobjectmaterial);
    newObject1.rotation.copy(newObject.rotation);

    if (template == templateoptions.MECH_TEA || template == templateoptions.MECH_POSTERIOR_TEA) {
        let obj = scene.getObjectByName("Axial - Rod inst at Distal Medial Pt", true);
        if (undefined != obj)
            scene.remove(obj);
        newObject1.name = "Axial - Rod inst at Distal Medial Pt";
    }
    if (template == templateoptions.ANAT_TEA || template == templateoptions.ANAT_POSTERIOR_TEA) {
        let obj = scene.getObjectByName("Axial at Distal Med Extent", true);
        if (undefined != obj)
            scene.remove(obj);
        newObject1.name = "Axial at Distal Med Extent";
    }

    newObject1.updateMatrixWorld(true);
    //Setting second deflexion plane's position
    let DistalMedialExtent = scene.getObjectByName("Distal Medial Extent", true);
    let DistalLateralExtent = scene.getObjectByName("Distal Lateral Extent", true);


    let nrm = calculateNormals(newObject1, DistalLateralExtent.position.clone());
    let copiedplane = new THREE.Plane();
    copiedplane.setFromNormalAndCoplanarPoint(nrm.clone(), newObject.position.clone());

    let dist1 = copiedplane.distanceToPoint(DistalMedialExtent.position.clone());
    let dist2 = copiedplane.distanceToPoint(DistalLateralExtent.position.clone());

    newObject1.position.set(newObject.position.x, newObject.position.y, newObject.position.z);
    if (dist1 > dist2)
        newObject1.translateOnAxis(nrm.clone(), dist1);
    else
        newObject1.translateOnAxis(nrm.clone(), dist2);
    scene.add(newObject1);
    AddParentForJSTREE(newObject1);
    //creating the 3rd plane
    newgeom = new THREE.PlaneGeometry(100, 100);
    newobjectmaterial = newObject1.material.clone();
    let newObject2 = new THREE.Mesh(newgeom, newobjectmaterial);
    newObject2.rotation.copy(newObject.rotation);
    if (templateoptions.MECH_TEA == template || templateoptions.MECH_POSTERIOR_TEA == template) {
        let obj = scene.getObjectByName("Mech Distal Resect Plane - 10mm", true);
        if (undefined != obj)
            scene.remove(obj);
        newObject2.name = "Mech Distal Resect Plane - 10mm";
    }
    else if (templateoptions.ANAT_TEA == template || templateoptions.ANAT_POSTERIOR_TEA == template) {
        let obj = scene.getObjectByName("Anat Distal Resect Plane - 10mm", true);
        if (undefined != obj)
            scene.remove(obj);
        newObject2.name = "Anat Distal Resect Plane - 10mm";
    }

    newObject2.position.set(newObject1.position.x, newObject1.position.y, newObject1.position.z);
    newObject2.translateOnAxis(nrm.clone(), -10);
    scene.add(newObject2);
    AddParentForJSTREE(newObject2);
    if (undefined == implantgroup)
        return;

    implantgroup.position.copy(newObject2.position);
}

function CreateAnatomicalAxisandDistalPlane() {

    let obj = scene.getObjectByName("Anatomical Axis", true);
    if (undefined != obj)
        scene.remove(obj);
    obj = scene.getObjectByName("Normal to Anat Axis", true);
    if (undefined != obj)
        scene.remove(obj);
    obj = scene.getObjectByName("5Â° Ext - perp-to-TEA ref for rotation", true);
    if (undefined != obj)
        scene.remove(obj);

    let firstpoint = scene.getObjectByName("Proximal Anatomic Canal", true);
    let secondpoint = scene.getObjectByName("Distal Anatomic Canal", true);
    let rodInsertpt = scene.getObjectByName("Rod Insertion Pt", true);
    if (undefined == firstpoint || undefined == secondpoint)
        return;
    linepoints[0] = secondpoint.position;
    linepoints[1] = firstpoint.position;
    CreateLine("Anatomical Axis");

    linepoints[1] = secondpoint.position;
    linepoints[0] = firstpoint.position;
    CreatePlane(rodInsertpt.position, "Normal to Anat Axis");
    LockAllAxes(scene.getObjectByName("Normal to Anat Axis", true));
}

function CreateVarusValgusAngle(vvangle) {
    let tempcoronalaxis = scene.getObjectByName("Temp Coronal axis", true);
    if (undefined == tempcoronalaxis) {
        return;
    }

    let MechDistalResectPlane = scene.getObjectByName("5Â° Ext - perp-to-TEA ref for rotation", true);
    if (undefined != MechDistalResectPlane) {
        scene.remove(MechDistalResectPlane);
    }

    let distalplane = scene.getObjectByName("Normal to Anat Axis", true);
    if (undefined == distalplane) {
        distalplane = scene.getObjectByName("Axial - Mech Axis - Rod inst", true);
        if (undefined == distalplane) {
            return;
        }
    }

    let geometry = new THREE.PlaneGeometry(100, 100);
    let material = distalplane.material.clone();
    let tempdistalplane = new THREE.Mesh(geometry, material);
    tempdistalplane.rotation.copy(distalplane.rotation);
    tempdistalplane.name = "5Â° Ext - perp-to-TEA ref for rotation";
    tempdistalplane.position.copy(distalplane.position);
    scene.add(tempdistalplane);
    AddParentForJSTREE(tempdistalplane);

    let arr = tempcoronalaxis.geometry.attributes.position.array;
    let v1 = new THREE.Vector3(arr[0] - arr[3], arr[1] - arr[4], arr[2] - arr[5]);
    v1.normalize();
    tempcoronalaxis.name = "Mech Temp Coronal axis";
    if (undefined == vvangle)
        vvangle = 0;
    tempdistalplane.rotateOnWorldAxis(v1, THREE.Math.degToRad(vvangle));
    ProjectEpicondlyeAxisOnDistalPlane();
    CreateInterNalCoordinateForSagittalAndCoronalPlane();

}

// document.getElementById("ReadFromAnatomicalPosteriorTemplate").onclick = function (e) {
//     template = templateoptions.ANAT_POSTERIOR_TEA;
//     DeleteLinesAndPlanes();
//     CreateAnatomicalAxisandDistalPlane();
//     CreateMechanicalAxisandDistalPlane();
//     //CreateAxisbetweenMedialandLateralEpicondyle();
//     CreateAxisbetweenPostMedialAndLateralExtent();
//     ProjectEpicondlyeAxisOnDistalPlane();
//     CreateInterNalCoordinateForSagittalAndCoronalPlane();
//     CreateVarusValgusAngle(5);
//     CreateSagittalAndCoronalPlane();
//     CreateflexionandAssociatedPlanes();

//     if (once) {
//         CreateLinesandPlanesForImplants();
//         AddMeshesInImplantGroup();
//     }
//     RefreshTreeData();
// }

// document.getElementById("ReadFromAnatomicalTEATemplate").onclick = function (e) {
//     template = templateoptions.ANAT_TEA;
//     DeleteLinesAndPlanes();

//     CreateAnatomicalAxisandDistalPlane();
//     CreateMechanicalAxisandDistalPlane();
//     CreateAxisbetweenMedialandLateralEpicondyle();
//     ProjectEpicondlyeAxisOnDistalPlane();
//     CreateInterNalCoordinateForSagittalAndCoronalPlane();
//     CreateVarusValgusAngle(5);
//     CreateSagittalAndCoronalPlane();
//     CreateflexionandAssociatedPlanes();

//     if (once) {
//         CreateLinesandPlanesForImplants();
//         AddMeshesInImplantGroup();
//     }
//     RefreshTreeData();
// }

// document.getElementById("ReadFromPosteriorTemplate").onclick = function (e) {
//     template = templateoptions.MECH_POSTERIOR_TEA;

//     //Remove All derivedMeshes
//     DeleteLinesAndPlanes();
//     //Axis and plane creation for Femur Bone
//     CreateMechanicalAxisandDistalPlane();
//     CreateAxisbetweenPostMedialAndLateralExtent();
//     ProjectEpicondlyeAxisOnDistalPlane();
//     CreateInterNalCoordinateForSagittalAndCoronalPlane();
//     CreateVarusValgusAngle();
//     CreateSagittalAndCoronalPlane();
//     CreateflexionandAssociatedPlanes();

//     if (once) {
//         CreateLinesandPlanesForImplants();
//         AddMeshesInImplantGroup();
//     }
//     RefreshTreeData();
// }

// document.getElementById("ReadFromTEATemplate").onclick = function (e) {
//     //Remove All derivedMeshes
//     template = templateoptions.MECH_TEA;
//     DeleteLinesAndPlanes();

//     //Axis and plane creation for Femur Bone
//     CreateMechanicalAxisandDistalPlane();
//     CreateAxisbetweenMedialandLateralEpicondyle();
//     ProjectEpicondlyeAxisOnDistalPlane();
//     CreateInterNalCoordinateForSagittalAndCoronalPlane();
//     CreateVarusValgusAngle();
//     CreateSagittalAndCoronalPlane();
//     CreateflexionandAssociatedPlanes();

//     if (once) {
//         CreateLinesandPlanesForImplants();
//         AddMeshesInImplantGroup();
//     }
//     RefreshTreeData();
// }

// document.getElementById("ReadFromTibiaTemplate").onclick = function (e) {
//     //Remove All derivedMeshes
//     template = templateoptions.MECH_TEA;
//     DeleteLinesAndPlanes();

//     //Axis and plane creation for Tibia Bone
//     CreateMechanicalAxisandAxialPlane();
//     // CreatePerpendicularLines()
//     // CreateAxisbetweenMedialandLateralEpicondyle();
//     // ProjectEpicondlyeAxisOnDistalPlane();
//     // CreateInterNalCoordinateForSagittalAndCoronalPlane();
//     // CreateVarusValgusAngle();
//     // CreateSagittalAndCoronalPlane();
//     // CreateflexionandAssociatedPlanes();

//     // if (once) {
//     //     CreateLinesandPlanesForImplants();
//     //     AddMeshesInImplantGroup();
//     // }
//     // RefreshTreeData();
// }

// document.getElementById("SelectPoints").onclick = function(e){
//     DrawGeometry = options.POINTSELECTFORTIBIA
//     firstpointselected = true;
// }
// document.getElementById("CreateHorizontalAxis").onclick = function(e){
//     CreateLineatAngle()
//     // DrawGeometry = options.POINTSELECTFORTIBIA
//     // firstpointselected = true;
//     // CreateHorizontalAxis()
// }

function CreateLineatAngle(){
    let CurvedAreaLine1 = scene.getObjectByName("CurvedAreaLine1", true);
    let CurvedAreaLine2 = scene.getObjectByName("CurvedAreaLine2", true);
    let array2 = CurvedAreaLine2.geometry.attributes.position.array;
    let array1 = CurvedAreaLine1.geometry.attributes.position.array;
    
    let CurvedAreaLine1Vector = new THREE.Vector3((array1[0] - array1[3]), (array1[1] - array1[4]), (array1[2] - array1[5])); 
    let CurvedAreaLine2Vector = new THREE.Vector3((array2[0] - array2[3]), (array2[1] - array2[4]), (array2[2] - array2[5]));
    CurvedAreaLine1Vector.normalize();
    CurvedAreaLine2Vector.normalize();
    
    let angle = CurvedAreaLine1Vector.clone().angleTo(CurvedAreaLine2Vector.clone());
    angle = Math.abs(180-(THREE.Math.radToDeg(angle)));
    let TempPoint1 = new THREE.Vector3(array1[0], array1[1], array1[2]);
    let TempPoint2 = new THREE.Vector3(array2[3], array2[4], array2[5]);
    let dist = TempPoint1.distanceTo(TempPoint2);
    let point1 = TempPoint1
    let point2 = TempPoint2
    let material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    let pointsposition = [point1, point2]
    var geometry = new THREE.BufferGeometry().setFromPoints(pointsposition);
    var line = new THREE.Line(geometry, material);
    line.name = "TempLine"
    // scene.add(line);
    let oneThirdLength = dist/3
    console.log(oneThirdLength)

    // let TempLine = scene.getObjectByName("TempLine", true);
    let array3 = line.geometry.attributes.position.array;
    let TempLineVector = new THREE.Vector3((array3[0] - array3[3]), (array3[1] - array3[4]), (array3[2] - array3[5])); 
    TempLineVector.normalize();
    var newpt = TempPoint1.clone().add(TempLineVector.multiplyScalar(-oneThirdLength));
    CreateSphereGeometrywithpoint(newpt, "TempPoint");

    let firstPoint = scene.getObjectByName("Proximal Tibia", true);
    let secondPoint = scene.getObjectByName("TempPoint", true);

    linepoints[0] = firstPoint.position;
    linepoints[1] = secondPoint.position;
    CreateLine("BisectorLine");

    let MechAxis = scene.getObjectByName("Mechanical Axis", true);
    
    let AxisArray = MechAxis.geometry.attributes.position.array;
    let firstlinevector = new THREE.Vector3(AxisArray[3] - AxisArray[0], AxisArray[4] - AxisArray[1], AxisArray[5] - AxisArray[2]);

    let BisectorLine = scene.getObjectByName("BisectorLine", true);
    let BisectorLineArray = BisectorLine.geometry.attributes.position.array;
    let secondlinevector = new THREE.Vector3(BisectorLineArray[3] - BisectorLineArray[0], BisectorLineArray[4] - BisectorLineArray[1], BisectorLineArray[5] - BisectorLineArray[2]);
    
    let frompoint = new THREE.Vector3(BisectorLineArray[0], BisectorLineArray[1], BisectorLineArray[2]);
    let topoint = new THREE.Vector3(BisectorLineArray[3], BisectorLineArray[4], BisectorLineArray[5]);
    let distance = frompoint.distanceTo(topoint);//distance of 2nd line
    
    let firstptvector = new THREE.Vector3(AxisArray[0], AxisArray[1], AxisArray[2]);

    var PerpendicularVector = new THREE.Vector3();
    PerpendicularVector.crossVectors(firstlinevector.clone(), secondlinevector.clone());
    PerpendicularVector.normalize()

    // var finalptvect = firstptvector.clone().add(thirdvector.multiplyScalar(-distance));
    var finalptvect = firstptvector.clone().add(PerpendicularVector.clone().multiplyScalar(-distance));
    CreateSphereGeometrywithpoint(finalptvect);
    // CreateProjectedLine(firstptvector, finalptvect);
    
    
    linepoints[0] = firstptvector;
    linepoints[1] = finalptvect;
    CreateLine("Horizontal Axis");

    CreateflexionPlanes()
}
function CreateflexionPlanes() {
    let HorzontalLine = scene.getObjectByName("Horizontal Axis", true);
    let HorizontalLineArray = HorzontalLine.geometry.attributes.position.array;
    let HorzontalAxis = new THREE.Vector3(HorizontalLineArray[3] - HorizontalLineArray[0], HorizontalLineArray[4] - HorizontalLineArray[1], HorizontalLineArray[5] - HorizontalLineArray[2]);
    HorzontalAxis.normalize();
    
    //--- POSTERIOR SLOPE PLANE---
    let AxialPlane = scene.getObjectByName("Axial Plane", true);
    let flexioPlaneMaterial = AxialPlane.material.clone();
    let flexioPlaneGeom;
    if (AxialPlane.geometry.type == "PlaneGeometry")
    flexioPlaneGeom = new THREE.PlaneGeometry(100, 100);
    let FlexionPlane = new THREE.Mesh(flexioPlaneGeom, flexioPlaneMaterial);
    FlexionPlane.rotation.copy(AxialPlane.rotation);
    FlexionPlane.name = "Posterior Slope Plane";

    FlexionPlane.position.set(AxialPlane.position.x, AxialPlane.position.y, AxialPlane.position.z);
    FlexionPlane.rotateOnWorldAxis(HorzontalAxis, THREE.Math.degToRad(3));
    scene.add(FlexionPlane);
    transformControl.attach(FlexionPlane);

    // --LATERAL COMPARTMENT PLANE

    let lateralCompPoint = scene.getObjectByName("Lateral Compartment")
    // let AxialPlane = scene.getObjectByName("Axial Plane", true);
    let LateralCompPlaneMaterial = AxialPlane.material.clone();
    let LateralCompPlaneGeom;
    if (AxialPlane.geometry.type == "PlaneGeometry")
    LateralCompPlaneGeom = new THREE.PlaneGeometry(100, 100);
    let LateralCompPlane = new THREE.Mesh(LateralCompPlaneGeom, LateralCompPlaneMaterial);
    LateralCompPlane.rotation.copy(AxialPlane.rotation);
    LateralCompPlane.name = "Lateral Compartment Plane";

    LateralCompPlane.position.set(lateralCompPoint.position.x, lateralCompPoint.position.y, lateralCompPoint.position.z);
    LateralCompPlane.rotateOnWorldAxis(HorzontalAxis, THREE.Math.degToRad(3));
    scene.add(LateralCompPlane);
    transformControl.attach(LateralCompPlane); 

    //-- MEDIAL COMPARTMENT PLANE
    let MedialCompPoint = scene.getObjectByName("Medial Compartment")
    let LateralCompartmentPlane = scene.getObjectByName("Lateral Compartment Plane", true);
    let MedialCompPlaneMaterial = LateralCompartmentPlane.material.clone();
    let MedialCompPlaneGeom;
    if (LateralCompartmentPlane.geometry.type == "PlaneGeometry")
    MedialCompPlaneGeom = new THREE.PlaneGeometry(100, 100);
    let MedailCompPlane = new THREE.Mesh(MedialCompPlaneGeom, MedialCompPlaneMaterial);
    MedailCompPlane.rotation.copy(LateralCompartmentPlane.rotation);
    MedailCompPlane.name = "Medial Compartment Plane";

    MedailCompPlane.position.set(MedialCompPoint.position.x, MedialCompPoint.position.y, MedialCompPoint.position.z);
    // LateralCompPlane.rotateOnWorldAxis(HorzontalAxis, THREE.Math.degToRad(3));
    scene.add(MedailCompPlane);
    // currentmesh = LateralCompPlane;
    transformControl.attach(MedailCompPlane);

    let LateralPlanenormal = calculateNormals(LateralCompPlane, lateralCompPoint.position.clone()); 
    let point1 = lateralCompPoint.position.clone().add(LateralPlanenormal.multiplyScalar(10))
    CreateSphereGeometrywithpoint(point1, "10mm down pt form Lateral")

    let LateralResectPosition = scene.getObjectByName("10mm down pt form Lateral", true);
    let LateralResectPlaneGeom;
    let LatrealResectPlaneMat = LateralCompartmentPlane.material.clone();
    if (LateralCompartmentPlane.geometry.type == "PlaneGeometry")
    LateralResectPlaneGeom = new THREE.PlaneGeometry(100, 100);
    let LateralResectPlane = new THREE.Mesh(LateralResectPlaneGeom, LatrealResectPlaneMat);
    LateralResectPlane.rotation.copy(LateralCompartmentPlane.rotation);
    LateralResectPlane.name = "Lateral Resect Plane";

    LateralResectPlane.position.set(LateralResectPosition.position.x, LateralResectPosition.position.y, LateralResectPosition.position.z);
    // LateralResectPlane.rotateOnWorldAxis(HorzontalAxis, THREE.Math.degToRad(3));
    scene.add(LateralResectPlane);
    transformControl.attach(LateralResectPlane); 

    let MedialPlaneNormal = calculateNormals(MedailCompPlane, MedialCompPoint.position.clone()); 
    let point2 = MedialCompPoint.position.clone().add(MedialPlaneNormal.multiplyScalar(10))
    CreateSphereGeometrywithpoint(point2, "10mm down pt from Medial")

    let MedialResectPosition = scene.getObjectByName("10mm down pt from Medial", true);
    let MedialResectPlaneGeom;
    let MedialResectPlaneMat = MedailCompPlane.material.clone();
    if (MedailCompPlane.geometry.type == "PlaneGeometry")
    MedialResectPlaneGeom = new THREE.PlaneGeometry(100, 100);
    let MedialResectPlane = new THREE.Mesh(MedialResectPlaneGeom, MedialResectPlaneMat);
    MedialResectPlane.rotation.copy(MedailCompPlane.rotation);
    MedialResectPlane.name = "Medial Resect Plane";
    MedialResectPlane.position.set(MedialResectPosition.position.x, MedialResectPosition.position.y, MedialResectPosition.position.z);
    // LateralResectPlane.rotateOnWorldAxis(HorzontalAxis, THREE.Math.degToRad(3));
    scene.add(MedialResectPlane);
    transformControl.attach(MedialResectPlane); 






}


function calculateNormals(mesh, pos) {

    let cameraVector;

    if (undefined == pos)
        cameraVector = (new THREE.Vector3(0, 0, -1)).applyQuaternion(camera.quaternion);
    else {
        pos.negate();
        cameraVector = pos;
    }

    var normalMatrix = new THREE.Matrix3(); // create once and reuse
    var worldNormal = new THREE.Vector3(); // create once and reuse

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

document.getElementById("draw-points").onclick = function (e) {
    // DrawGeometry = options.DRAWPOINT;
    const drawPointsButton = document.getElementById('draw-points');
    const pointOptionsDiv = document.getElementById('point-options');
    const radioButtons = document.querySelectorAll('#point-options input[type="radio"]');

    drawPointsButton.addEventListener('click', () => {
        pointOptionsDiv.classList.toggle('hidden');
    });

    radioButtons.forEach((radio) => {
        radio.addEventListener('change', () => {
            radioButtons.forEach(r => r.parentElement.style.color = ''); // Reset other labels
            if (radio.checked) {
                radio.parentElement.style.color = 'black';
                raycaster.setFromCamera(mouse, camera);
                let intersection = raycaster.intersectObjects(scene.children);
                CreateSphereGeometrywithpoint(intersection[0].point,'Femur Center');

            }
        });
    });
}
function createLandmark(intersection) {
    //hit points on bone entities
    const drawPointsButton = document.getElementById('draw-points');
    const isActive = !drawPointsButton.classList.contains('active');
    drawPointsButton.classList.toggle('active', isActive);
    if (isActive) {
        drawPointsButton.style.backgroundColor = 'blue'; // Change button color to blue
        // Call your draw points function here (replace with actual function call)
        CreateSphereGeometrywithpoint(intersection[0].point,'Femur Center');
    } else {
        drawPointsButton.style.backgroundColor = ''; // Reset button color
        // You can add logic here for when the button is inactive
    }
}
function CreateSphereGeometrywithpoint(point, SphereName) {
    const geometry = new THREE.SphereGeometry(0.5, 64, 64);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    sphere.position.set(point.x, point.y, point.z);
    sphere.name = SphereName
    currentmesh = sphere.clone();
}
function OnCanvasClick() {
    raycaster.setFromCamera(mouse, camera);
    let intersection;
    if (DrawGeometry != options.DRAWPOINT)
        intersection = raycaster.intersectObjects(scene.children);
    else
        intersection = raycaster.intersectObjects(group.children);

    if (intersection.length > 0) {
        selectedent = selectionon.ENTITY;
        PerformOnClickOperations(intersection);
    }
}
function CreateBoxGeometry() {
    const geometry = new THREE.BoxGeometry(15, 64, 64);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    cube.name = "helper";
    scene.add(cube);
    let bbox = new THREE.Box3().setFromObject(group);
    cube.position.set(bbox.getCenter().x, bbox.getCenter().y, bbox.getCenter().z);
    //CreateTransformControls();
    transformControl.attach(cube);
    scene.add(transformControl);
    currentmesh = cube;
}


// document.getElementById("hidden").onclick = function (e) {
//     if (null == currentmesh)
//         return;
//     hiddengroup.add(currentmesh);
//     scene.remove(currentmesh);
// }

function updatetransformcontrol(object) {
    transformControl.showX = !object.userData.lockX;
    transformControl.showY = !object.userData.lockY;
    transformControl.showZ = !object.userData.lockZ;
}

function CreateSphereGeometry() {
    const geometry = new THREE.SphereGeometry(15, 64, 64);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = "helper";
    scene.add(sphere);
    let bbox = new THREE.Box3().setFromObject(group);
    sphere.position.set(bbox.getCenter().x, bbox.getCenter().y, bbox.getCenter().z);
    //CreateTransformControls();
    transformControl.attach(sphere);
    scene.add(transformControl);
    currentmesh = sphere;
}
//uncomment later
// document.getElementById("draw-line").onclick = function (e) {
//     DrawGeometry = options.POINTSELECT;
//     firstpointselected = true;
// }

// document.getElementById("align-plane").onclick = function (e) {
//     DrawGeometry = options.SELECTION;
//     if (currentmesh == undefined)
//         return;

// }

// document.getElementById("import-landmark-points").onchange = function (e) {
//     ReadTextFile(this.files[0]);
//     this.value = null;
// }

// document.getElementById("XPlaneAngle").onchange = function (e) {
//     currentmesh.rotation.x = THREE.Math.degToRad(parseFloat(this.value));
// }
// document.getElementById("YPlaneAngle").onchange = function (e) {
//     currentmesh.rotation.y = THREE.Math.degToRad(parseFloat(this.value));
// }
// document.getElementById("ZPlaneAngle").onchange = function (e) {
//     currentmesh.rotation.z = THREE.Math.degToRad(parseFloat(this.value));
// }

// document.getElementById("XPlanePosition").onchange = function (e) {
//     currentmesh.position.x = parseFloat(this.value);
// }
// document.getElementById("YPlanePosition").onchange = function (e) {
//     currentmesh.position.y = parseFloat(this.value);
// }
// document.getElementById("ZPlanePosition").onchange = function (e) {
//     currentmesh.position.z = parseFloat(this.value);
// }

const link = document.createElement('a');
link.style.display = 'none';
document.body.appendChild(link);

// document.getElementById("SaveModel").onclick = function (e) {
//     var jsonObj = {
//         landmark_points: {},
//         axis: {},
//         plane: {}
//     }

//     // controls.detach();
//     scene.updateMatrixWorld(true);
//     jsonObj = CreateJSONForGroups(scene, jsonObj);
//     if (undefined == jsonObj)
//         return;
//     jsonObj = JSON.stringify(jsonObj);
//     saveString(jsonObj, 'scene.json');

//     return;
//     scene.remove(group);
//     var exporter = new STLExporter();
//     saveString(exporter.parse(scene), 'model.stl');
//     scene.add(group);
// };


function CreateJSONForGroups(scenegroup, jsonObj) {
    let i = 0;
    while (scenegroup.children.length > i) {
        if ("Group" == scenegroup.children[i].type) {
            jsonObj = CreateJSONForGroups(scenegroup.children[i], jsonObj);
            i++;
            continue;
        }

        if (undefined == scenegroup.children[i].name || undefined == scenegroup.children[i].geometry) {
            i++;
            continue;
        }

        if (scenegroup.children[i].type == "Line") {
            let arr = scenegroup.children[i].geometry.attributes.position.array;
            jsonObj.axis[scenegroup.children[i].name] = ["Axis", new THREE.Vector3(arr[0], arr[1], arr[2]), new THREE.Vector3(arr[3], arr[4], arr[5])];
        }

        else if ("SphereGeometry" == scenegroup.children[i].geometry.type) {
            jsonObj.landmark_points[scenegroup.children[i].name] = ["Point", scenegroup.children[i].position]
        }
        else if (scenegroup.children[i].geometry.type == "PlaneGeometry") {
            let normal = calculateNormals(scenegroup.children[i]);
            normal.normalize();
            jsonObj.plane[scenegroup.children[i].name] = ["Plane", normal, scenegroup.children[i].position]
        }
        i++;
    }
    return jsonObj;

}

function save(blob, filename) {

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

}
function saveString(text, filename) {

    save(new Blob([text], { type: 'text/plain' }), filename);

}

function ReadTextFile(textFile) {
    if (!(textFile.name.endsWith("txt"))) {
        alert("Please Select a text file");
        return;
    }
    const objectURL = URL.createObjectURL(textFile);
    var fr = new FileReader();
    fr.onload = function (progressEvent) {
        var lines = this.result.split('\n');
        for (var line = 0; line < lines.length; line++) {
            var points = lines[line].toString().split('\t');
            const geometry = new THREE.SphereGeometry(0.5, 64, 64);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.name = points[0];
            scene.add(sphere);
            AddParentForJSTREE(sphere);
            sphere.position.set(parseFloat(points[1]), parseFloat(points[2]), parseFloat(points[3]));
            POINTS.push(sphere);
        }
    };
    fr.readAsText(textFile);
}
//Insert planes button click
// document.getElementById("insert-plane").onclick = function (e) {
//     DrawGeometry = options.LINESELECTION;
//     firstlineselected = true;
//     firstpointselected = false;
//     //CreatePlane();
// }

function ProjectLineOnPlane(firstMesh, secondMesh, OriginalSecondMesh, TempAxisName) {
    let obj = scene.getObjectByName("ProjectedPoint1", true);
    if (undefined != obj)
        scene.remove(obj);
    obj = scene.getObjectByName("ProjectedPoint2", true);
    if (undefined != obj)
        scene.remove(obj);

    let twopointsinarray = firstMesh.geometry.attributes.position.array;

    let firstpoint = new THREE.Vector3(twopointsinarray[0], twopointsinarray[1], twopointsinarray[2]);
    let secondpoint = new THREE.Vector3(twopointsinarray[3], twopointsinarray[4], twopointsinarray[5]);


    let nrm = calculateNormals(OriginalSecondMesh);
    nrm.normalize();
    let projectedfirstpt = new THREE.Vector3();
    let projectedsecondpt = new THREE.Vector3();
    let plane = new THREE.Plane();
    plane.setFromNormalAndCoplanarPoint(nrm, OriginalSecondMesh.position.clone());
    plane.projectPoint(firstpoint, projectedfirstpt);
    plane.projectPoint(secondpoint, projectedsecondpt);

    CreateSphereGeometrywithpoint(projectedfirstpt, "ProjectedPoint1");
    CreateSphereGeometrywithpoint(projectedsecondpt, "ProjectedPoint2");

    //joining these two points to create a line
    CreateProjectedLine(projectedfirstpt, projectedsecondpt, TempAxisName);

    return;


    //Setting the plane in accordance with the plane geometry 

    plane = new THREE.Plane();
    var normal = new THREE.Vector3(secondMesh.userData.x, secondMesh.userData.y, secondMesh.userData.z);
    var point = new THREE.Vector3();

    // normal.set(0, 0, 1).applyQuaternion(intersection[0].object.quaternion);
    point.copy(secondMesh.position);
    plane.setFromNormalAndCoplanarPoint(normal, point);

    //Projecting the first point on the plane
    var tempraycaster = new THREE.Raycaster(firstpoint, normal.clone().negate(), 0, Number.POSITIVE_INFINITY);
    var hits = tempraycaster.intersectObject(OriginalSecondMesh, true);
    if (hits.length == 0) {
        tempraycaster = new THREE.Raycaster(firstpoint, normal.clone(), 0, Number.POSITIVE_INFINITY);
        hits = tempraycaster.intersectObject(OriginalSecondMesh, true);
        if (hits.length == 0)
            return;
    }

    var pointOnPlane = hits[0].point;
    CreateSphereGeometrywithpoint(pointOnPlane);
    var point1 = pointOnPlane;

    //Projecting the second point on the plane 
    tempraycaster = new THREE.Raycaster(secondpoint, normal.clone().negate(), 0, Number.POSITIVE_INFINITY);
    hits = tempraycaster.intersectObject(OriginalSecondMesh, true);

    if (hits.length == 0) {
        tempraycaster = new THREE.Raycaster(secondpoint, normal.clone(), 0, Number.POSITIVE_INFINITY);
        hits = tempraycaster.intersectObject(OriginalSecondMesh, true);
        if (hits.length == 0)
            return;
    }
    pointOnPlane = hits[0].point;
    CreateSphereGeometrywithpoint(pointOnPlane);
    var point2 = pointOnPlane;

    //joining these two points to create a line
    CreateProjectedLine(point1, point2, TempAxisName);
}

// document.getElementById("landmark-fix-button").onclick = function (e) {
//     let bcube = scene.getObjectByName("helper", true);
//     bcube.geometry.computeBoundingBox();
//     let bbox = new THREE.Box3().setFromObject(bcube);
//     const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
//     const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
//     const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
//     sphere.position.copy(bbox.getCenter());
//     scene.add(sphere);
//     scene.remove(bcube);
//     scene.remove(transformControl);
//     POINTS.push(sphere);
//     linepoints[0] = bbox.getCenter();
//     firstpointselected = true;
// }
document.getElementById("actual-btn").onchange = function (e) {
    LoadModels(this.files);
    this.value = null;
}
document.getElementById("canvas-container").onclick = function (e) {
    if (select) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;
        OnCanvasClick();
    }
}

// document.getElementById("import-implant").onchange = function (e) {
//     LoadImplant(this.files[0]);
// }


function updateform(object) {
    currentmesh = object;
    document.getElementById("PlaneForm").style.display = "block";
    //Rotation
    document.getElementById("XPlaneAngle").value = THREE.Math.radToDeg(currentmesh.rotation.x).toFixed(2);
    document.getElementById("YPlaneAngle").value = THREE.Math.radToDeg(currentmesh.rotation.y).toFixed(2);
    document.getElementById("ZPlaneAngle").value = THREE.Math.radToDeg(currentmesh.rotation.z).toFixed(2);

    //Position
    document.getElementById("XPlanePosition").value = currentmesh.position.x.toFixed(2);
    document.getElementById("YPlanePosition").value = currentmesh.position.y.toFixed(2);
    document.getElementById("ZPlanePosition").value = currentmesh.position.z.toFixed(2);
}

function changeColour(mesh) {
    var code = Math.floor(Math.random() * 256 * 256 * 256);
    code = code.toString(16);
    code = "0x" + code;
    mesh.material.color.setHex(code);
}


function CheckIfmeshFromGroupLandMarkPoints(mesh) {
    switch (mesh.name) {
        case "Rod Insertion Pt":
        case "Medial Epicondyle":
        case "Lateral Epicondyle":
        case "FemHeadCenter":
        case "Distal Medial Extent":
        case "Distal Lateral Extent":
        case "Post Medial Extent":
        case "Post Lateral Extent":
        case "Proximal Anatomic Canal":
        case "Distal Anatomic Canal":
            {
                if (mesh.userData.parent == "")
                    mesh.userData.parent = "Landmark Points";
                else
                    mesh.userData = { parent: "Landmark Points" };
                return true;
            }
    }
    return false;
}

function CheckIfmeshFromGroupMechanicalAxisAlignment(mesh) {
    if ((mesh.name == "5Â° Ext - perp-to-TEA ref for rotation" && (templateoptions.MECH_TEA == template || templateoptions.MECH_POSTERIOR_TEA == template))) {
        if (mesh.userData.parent == "")
            mesh.userData.parent = "Mechanical Axis Alignment";
        else
            mesh.userData = { parent: "Mechanical Axis Alignment" };

        return true;
    }

    switch (mesh.name) {
        case "Axial - Mech Axis - Rod inst":
        case "Mech - TEA Coord Sys":
        case "Mech - Post Cond Coord Sys":
        case "Mech - 3Â° Ext to Post Cond Coord Sys":
        case "Mech Flexion Adjust Plane":
        case "Axial - Rod inst at Distal Medial Pt":
        case "Mech Distal Resect Plane - 10mm":
            {
                if (mesh.userData.parent == "")
                    mesh.userData.parent = "Mechanical Axis Alignment";
                else
                    mesh.userData = { parent: "Mechanical Axis Alignment" };
                return true;
            }
    }
    return false;
}

function CheckIfmeshFromGroupMechAxisTEARotation(mesh) {
    switch (mesh.name) {
        case "Mech - TEA Sagittal":
        case "Mech - TEA Coronal":
        case "Angle - Mech-Anat Axes - Coronal":
            {
                if (mesh.userData.parent == "")
                    mesh.userData.parent = "Mech Axis - TEA Rotation";
                else
                    mesh.userData = { parent: "Mech Axis - TEA Rotation" };
                return true;
            }
    }
    return false;
}

function CheckIfmeshFromGroupMechAxisPostCondRotation(mesh) {
    switch (mesh.name) {
        case "Mech - Post Cond Sagittal":
        case "Mech - Post Cond Coronal":
            {
                if (mesh.userData.parent == "")
                    mesh.userData.parent = "Mech Axis - Post Cond Rotation";
                else
                    mesh.userData = { parent: "Mech Axis - Post Cond Rotation" };
                return true;
            }
    }
    return false;
}

function CheckIfmeshFromGroupMechAxisExttoPostCondRotation(mesh) {
    switch (mesh.name) {
        case "Mech - 3Â° Ext-Post-Cond Sagittal":
        case "Mech - 3Â° Ext-Post-Cond Coronal":
            {
                if (mesh.userData.parent == "")
                    mesh.userData.parent = "Mech Axis - 3Â° Ext to Post Cond Rotation";
                else
                    mesh.userData = { parent: "Mech Axis - 3Â° Ext to Post Cond Rotation" };
                return true;
            }
    }
    return false;
}

function CheckIfmeshFromGroupAnatomicalAxisAlignment(mesh) {

    if ((mesh.name == "5Â° Ext - perp-to-TEA ref for rotation" && (templateoptions.ANAT_TEA == template || templateoptions.ANAT_POSTERIOR_TEA == template))) {
        if (mesh.userData.parent == "")
            mesh.userData.parent = "Mechanical Axis Alignment";
        else
            mesh.userData = { parent: "Mechanical Axis Alignment" };

        return true;
    }
    switch (mesh.name) {
        case "Normal to Anat Axis":
        case "Anat - TEA Coord Sys":
        case "Anat - Post Cond Coord Sys":
        case "Anat - 3Â° Ext to Post Cond Coord Sys":
        case "Anat Flexion Adjust Plane":
        case "Axial at Distal Med Extent":
        case "Anat Distal Resect Plane - 10mm":
            {
                if (mesh.userData.parent == "")
                    mesh.userData.parent = "Anatomical Axis Alignment";
                else
                    mesh.userData = { parent: "Anatomical Axis Alignment" };
                return true;
            }
    }
    return false;
}

function CheckIfmeshFromGroupAnatAxisTEARotation(mesh) {
    switch (mesh.name) {
        case "Anat - TEA Sagittal":
        case "Anat - TEA Coronal":
            {
                if (mesh.userData.parent == "")
                    mesh.userData.parent = "Anat Axis 5Â° valgus - TEA Rotation";
                else
                    mesh.userData = { parent: "Anat Axis 5Â° valgus - TEA Rotation" };
                return true;
            }
    }
    return false;
}

function CheckIfmeshFromGroupAnatAxisPostCondRotation(mesh) {
    switch (mesh.name) {
        case "Anat - Post Cond Sagittal":
        case "Anat - Post Cond Coronal":
            {
                if (mesh.userData.parent == "")
                    mesh.userData.parent = "Anat Axis 5Â° valgus - Post Cond Rotation";
                else
                    mesh.userData = { parent: "Anat Axis 5Â° valgus - Post Cond Rotation" };
                return true;
            }
    }
    return false;
}

function CheckIfmeshFromGroupAnatAxisExttoPostCondRotation(mesh) {
    switch (mesh.name) {
        case "Anat - 3Â° Ext-Post-Cond Sagittal":
        case "Anat - 3Â° Ext-Post-Cond Coronal":
            {
                if (mesh.userData.parent == "")
                    mesh.userData.parent = "Anat Axis 5Â° valgus- 3Â° Ext to Post Cond Rotation";
                else
                    mesh.userData = { parent: "Anat Axis 5Â° valgus- 3Â° Ext to Post Cond Rotation" };
                return true;
            }
    }
    return false;
}

function AddParentForJSTREE(mesh) {
    let landmarkpoints = CheckIfmeshFromGroupLandMarkPoints(mesh);
    if (landmarkpoints)
        return;
    let mechaxalignment = CheckIfmeshFromGroupMechanicalAxisAlignment(mesh);
    if (mechaxalignment)
        return;
    let mechaxisTEArotation = CheckIfmeshFromGroupMechAxisTEARotation(mesh);
    if (mechaxisTEArotation)
        return;
    let mechaxispostcondrotation = CheckIfmeshFromGroupMechAxisPostCondRotation(mesh);
    if (mechaxispostcondrotation)
        return;
    let mechaxisexttopostcondrotation = CheckIfmeshFromGroupMechAxisExttoPostCondRotation(mesh);
    if (mechaxisexttopostcondrotation)
        return;
    let anataxalignment = CheckIfmeshFromGroupAnatomicalAxisAlignment(mesh);
    if (anataxalignment)
        return;
    let anatomicalTEArotation = CheckIfmeshFromGroupAnatAxisTEARotation(mesh);
    if (anatomicalTEArotation)
        return;
    let anatomicalPostCondrotation = CheckIfmeshFromGroupAnatAxisPostCondRotation(mesh);
    if (anatomicalPostCondrotation)
        return;
    let anataxisexttopostcondrotation = CheckIfmeshFromGroupAnatAxisExttoPostCondRotation(mesh);
    if (anataxisexttopostcondrotation)
        return;
    if (mesh.userData.parent == "")
        mesh.userData.parent = "Others";
    else
        mesh.userData = { parent: "Others" };
}

function CreateProjectedLine(point1, point2, TempAxisName) {
    const material = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 10 });
    let pointsposition = [point1, point2]
    const geometry = new THREE.BufferGeometry().setFromPoints(pointsposition);
    const line = new THREE.Line(geometry, material);
    if (undefined == TempAxisName)
        line.name = "";
    else
        line.name = TempAxisName;
    scene.add(line);
}

function checkiflineselected(intersection) {
    currentmesh = intersection[0].object.clone();
    for (let i = 0; i < intersection.length; i++) {
        if (intersection[i].object.type == "Line") {
            currentmesh = intersection[i].object.clone();
            break;
        }
    }
    if (currentmesh.type != "Line") {
        return -1;
    }
    else
        return 1;
}

function checkifpointselected(intersection) {
    currentmesh = intersection[0].object.clone();
    for (let i = 0; i < intersection.length; i++) {
        if (intersection[i].object.geometry.type == "SphereGeometry") {
            currentmesh = intersection[i].object.clone();
            intersection[i].object.material.color.setHex(0x00ff00);
            break;
        }
    }
    if (currentmesh.geometry.type != "SphereGeometry") {
        return -1;
    }
    else {
        return 1;
    }
}

// function checkifplaneselected(intersection) {
//     currentmesh = intersection[0].object.clone();
//     for (let i = 0; i < intersection.length; i++) {
//         if (intersection[i].object.geometry.type == "PlaneGeometry") {
//             currentmesh = intersection[i].object;
//             break;
//         }
//     }
//     if (currentmesh.geometry.type != "PlaneGeometry") {
//         return -1;
//     }
//     else {
//         return 1;
//     }
// }

function updatePositions() {
    let Medial_Point = implantgroup.getObjectByName("Implant_Medial_Point", true);
    let Lateral_Point = implantgroup.getObjectByName("Implant_Lateral_Point", true);
    let Centre_Point = implantgroup.getObjectByName("Implant_Centre_Point", true);
    Medial_Point.updateMatrixWorld();
    Lateral_Point.updateMatrixWorld();
    Centre_Point.updateMatrixWorld();

    if (undefined == Medial_Point || undefined == Lateral_Point || undefined == Centre_Point)
        return;

    let ImplantSagittalAxis = implantgroup.getObjectByName("Implant Sagittal Line", true);
    implantgroup.remove(ImplantSagittalAxis);
    let ImplantCoronalAxis = implantgroup.getObjectByName("Implant Coronal Line", true);
    implantgroup.remove(ImplantCoronalAxis);
    implantgroup.updateMatrixWorld();
    let pt1 = new THREE.Vector3();
    let pt2 = new THREE.Vector3();

    Medial_Point.getWorldPosition(pt1);
    Lateral_Point.getWorldPosition(pt2);
    linepoints[0] = pt1.clone();
    linepoints[1] = pt2.clone();
    CreateLine("Implant Sagittal Line");
    let obj = scene.getObjectByName("Implant Sagittal Line", true);
    AddMeshtoImplantGroup(obj);
    let midpt = implantgroup.getObjectByName("MidPoint", true).clone();

    Centre_Point.getWorldPosition(pt1);
    midpt.getWorldPosition(pt2);
    linepoints[1] = pt1.clone();
    linepoints[0] = midpt.position;
    CreateLine("Implant Coronal Line");
    obj = scene.getObjectByName("Implant Coronal Line", true);
    AddMeshtoImplantGroup(obj);

}

function ShowdistanceAndAngle(distance, angle) {
    document.getElementById("MeasurementForm").style.display = "block";
    document.getElementById("Distance").value = Math.round((distance + Number.EPSILON) * 10000) / 10000;
    document.getElementById("Angle").value = Math.round((angle + Number.EPSILON) * 10000) / 10000;;
}

function DistanceBetweenTwoPlanes(firstobject, secondobject) {

    if (undefined == firstobject || undefined == secondobject)
        return;
    let nrm1 = calculateNormals(firstobject);
    let nrm2 = calculateNormals(secondobject);

    let angle = nrm1.angleTo(nrm2);
    angle = THREE.Math.radToDeg(angle);
    ShowdistanceAndAngle(0, angle);
}

function DistanceBetweenTwoPoints(firstobject, secondobject) {
    if (undefined == firstobject || undefined == secondobject)
        return;
    let globalpos1 = new THREE.Vector3();
    let globalpos2 = new THREE.Vector3();
    globalpos1 = firstobject.localToWorld(globalpos1);
    globalpos2 = secondobject.localToWorld(globalpos2);
    let dist = globalpos1.distanceTo(globalpos2);
    ShowdistanceAndAngle(dist, 0);
}

function DisplayAngleBetweenTwoLines(firstobject, secondobject) {
    if (undefined == firstobject || undefined == secondobject)
        return;
    let arr = firstobject.geometry.attributes.position.array;
    let v1 = new THREE.Vector3(arr[0] - arr[3], arr[1] - arr[4], arr[2] - arr[5]);
    v1.normalize();

    arr = secondobject.geometry.attributes.position.array;
    let v2 = new THREE.Vector3(arr[0] - arr[3], arr[1] - arr[4], arr[2] - arr[5]);
    v2.normalize();

    let angle = v1.angleTo(v2);
    angle = THREE.Math.radToDeg(angle);
    ShowdistanceAndAngle(0, angle);
}

function PerformOnClickOperations(intersection) {
    if (DrawGeometry == options.DRAWPOINT) {
        //hit points on bone entities
        const drawPointsButton = document.getElementById('draw-points');
        const isActive = !drawPointsButton.classList.contains('active');
        drawPointsButton.classList.toggle('active', isActive);
        if(isActive){
            drawPointsButton.style.backgroundColor = 'blue'; // Change button color to blue
        // Call your draw points function here (replace with actual function call)
        CreateSphereGeometrywithpoint(intersection[0].point);
        } else {
        drawPointsButton.style.backgroundColor = ''; // Reset button color
        // You can add logic here for when the button is inactive
}
    }
    else if (DrawGeometry == options.TRANSLATE10MM) {
        let selectedplane = checkifplaneselected(intersection);
        if (selectedplane == -1) {
            return;
        }
        transformControl.setSpace('local');
        let newObj = new THREE.Mesh(currentmesh.geometry.clone(), currentmesh.material.clone());
        newObj.rotation.copy(currentmesh.rotation);
        newObj.position.set(currentmesh.position.x, currentmesh.position.y, currentmesh.position.z);
        let nrm = calculateNormals(newObj);
        nrm.normalize();
        newObj.translateOnAxis(nrm, 10);
        scene.add(newObj);
    }
    else if (DrawGeometry == options.MEASURE) {
        let selectedpoint = checkifpointselected(intersection);
        if (selectedpoint == -1) {
            let selectedline = checkiflineselected(intersection);
            if (selectedline == -1) {
                let selectedplane = checkifplaneselected(intersection);
                if (selectedplane == -1) {
                    return;
                }
            }
        }
        if (firstObjectSelected) {
            selectedObject = currentmesh.clone();
            firstObjectSelected = false;
        }
        else {
            firstObjectSelected = true;
            currentmesh = currentmesh.clone();

            if (selectedObject.type == "Line" && currentmesh.type == "Line") {
                DisplayAngleBetweenTwoLines(selectedObject, currentmesh);
            }
            if (selectedObject.geometry.type == "SphereGeometry" && currentmesh.geometry.type == "SphereGeometry") {
                DistanceBetweenTwoPoints(selectedObject, currentmesh);
            }
            if (selectedObject.geometry.type == "PlaneGeometry" && currentmesh.geometry.type == "PlaneGeometry") {
                DistanceBetweenTwoPlanes(selectedObject, currentmesh);
            }
        }
    }
    else if (DrawGeometry == options.NONE) {

        if (firstplaneselected) {
            let selectedplane = checkifplaneselected(intersection);
            if (selectedplane == -1) {
                return;
            }
            firstplaneselected = false;
            selectedObject = currentmesh;
        }
        else {
            let selectedline = checkiflineselected(intersection);
            if (selectedline == -1)
                return;
            firstplaneselected = true;
            if (selectedObject == currentmesh)
                return;
            let arr = currentmesh.geometry.attributes.position.array;
            rotationaxis = new THREE.Vector3(arr[3] - arr[0], arr[4] - arr[1], arr[5] - arr[2]);
            rotationaxis.normalize();
            let newobjectmaterial = selectedObject.material.clone();
            let newgeom;
            if (selectedObject.geometry.type == "PlaneGeometry")
                newgeom = new THREE.PlaneGeometry(100, 100);
            let newObject = new THREE.Mesh(newgeom, newobjectmaterial);
            newObject.rotation.copy(selectedObject.rotation);
            newObject.name = "FlexionPlane";

            newObject.position.set(selectedObject.position.x, selectedObject.position.y, selectedObject.position.z);
            newObject.rotateOnWorldAxis(rotationaxis, THREE.Math.degToRad(3));
            scene.add(newObject);
            currentmesh = newObject;
            transformControl.attach(currentmesh);
        }
    }
    else if (DrawGeometry == options.TRANSLATEAXIS) {
        let selectedplane = checkifplaneselected(intersection);
        if (selectedplane == -1) {
            return;
        }
        if (firstplaneselected) {
            firstplaneselected = false;
            selectedObject = currentmesh;
        }
        else {
            firstplaneselected = true;
            if (selectedObject == currentmesh)
                return;
            if (currentmesh.parent == undefined)
                currentmesh.position.set(selectedObject.position.x, selectedObject.position.y, selectedObject.position.z);
            else {
                let grp = currentmesh.parent;
                grp.position.set(selectedObject.position.x, selectedObject.position.y, selectedObject.position.z);
            }
        }
    }
    else if (DrawGeometry == options.PARALLEL) {

        let selectedplane = checkifplaneselected(intersection);
        if (selectedplane == -1) {
            return;
        }
        if (firstplaneselected) {
            firstplaneselected = false;
            selectedObject = currentmesh;
        }
        else {
            firstplaneselected = true;
            if (selectedObject == currentmesh)
                return;

            let v1 = calculateNormals(currentmesh);
            v1.normalize();
            let lookatvector = calculateNormals(selectedObject);
            lookatvector.normalize();
            var axis = v1.clone().cross(lookatvector);
            axis.normalize();
            var angle = Math.acos(v1.clone().dot(lookatvector));
            rotationWorldMatrix = new THREE.Matrix4();
            rotationWorldMatrix.makeRotationAxis(axis, angle);
            implantgroup.matrix.multiply(rotationWorldMatrix);
            implantgroup.rotation.setFromRotationMatrix(implantgroup.matrix);

            if (Math.abs(lookatvector.x) > Math.abs(lookatvector.y) && Math.abs(lookatvector.x) > Math.abs(lookatvector.z)) {
                implantgroup.position.set(selectedObject.position.x, implantgroup.position.y, implantgroup.position.z);
            }
            else if (Math.abs(lookatvector.y) > Math.abs(lookatvector.x) && Math.abs(lookatvector.y) > Math.abs(lookatvector.z)) {
                implantgroup.position.set(implantgroup.position.x, selectedObject.position.y, implantgroup.position.z);
            }
            else {
                implantgroup.position.set(implantgroup.position.x, implantgroup.position.y, selectedObject.position.z);

            }
        }
    }
    else if (DrawGeometry == options.CALULATEROTATION) {
        let selectedline = checkiflineselected(intersection);
        if (selectedline == -1) {
            return;
        }
        if (firstlineselected) {
            firstlineselected = false;
            selectedObject = currentmesh;
        }
        else {
            firstlineselected = true;
            let arr = selectedObject.geometry.attributes.position.array;
            let v1 = new THREE.Vector3(arr[0] - arr[3], arr[1] - arr[4], arr[2] - arr[5]);
            v1.normalize();
            arr = currentmesh.geometry.attributes.position.array;
            let v2 = new THREE.Vector3(arr[0] - arr[3], arr[1] - arr[4], arr[2] - arr[5]);
            v2.normalize();
            let quaternion = new THREE.Quaternion(); // create one and reuse it
            quaternion.setFromUnitVectors(v1, v2);
            let matrix = new THREE.Matrix4(); // create one and reuse it
            matrix.makeRotationFromQuaternion(quaternion);
            implantgroup.applyMatrix(matrix);

        }
    }
    else if (DrawGeometry == options.PLANEUSING3POINTS) {
        let selectedpoint = checkifpointselected(intersection);
        if (selectedpoint == -1)
            return;
        if (pointnum == pointselectednum.FIRSTPOINTSELECTED) {
            firstpt = currentmesh.position.clone();
            pointnum = pointselectednum.SECONDPOINTSELECTED;
        }
        else if (pointnum == pointselectednum.SECONDPOINTSELECTED) {
            secondpt = currentmesh.position.clone();
            pointnum = pointselectednum.THIRDPOINTSELECTED;
        }
        else if (pointnum == pointselectednum.THIRDPOINTSELECTED) {
            thirdpt = currentmesh.position.clone();
            pointnum = pointselectednum.FIRSTPOINTSELECTED;
            let vec1 = secondpt.clone().sub(firstpt.clone());
            let vec2 = thirdpt.clone().sub(firstpt.clone());
            let uvector = new THREE.Vector3();
            uvector.crossVectors(vec1, vec2);
            uvector.normalize();

            const plane = new THREE.Plane(uvector, 0);
            plane.setComponents(uvector.x, uvector.y, uvector.z, 0);
            const pg = new THREE.PlaneGeometry(100, 100);
            pg.lookAt(new THREE.Vector3(uvector.x, uvector.y, uvector.z));
            const pm = new THREE.MeshBasicMaterial({ color: 0xef00ab, side: THREE.DoubleSide, opacity: 0.3, transparent: true });

            var meshy = new THREE.Mesh(pg, pm);
            meshy.userData = { x: uvector.x, y: uvector.y, z: uvector.z, lockX: false, lockY: false, lockZ: false };
            meshy.position.set(firstpt.x, firstpt.y, firstpt.z)
            meshy.name = "plane";
            scene.add(meshy);
        }
    }
    else if (DrawGeometry == options.GROUPTOGETHER) {
        changeColour(intersection[0].object);
        scene.remove(intersection[0].object);
        implantgroup.add(intersection[0].object);
        currentmesh = implantgroup;
    }
    else if (DrawGeometry == options.MIDPOINT) {
        let selectedline = checkiflineselected(intersection);
        if (selectedline == -1)
            return;
        var arr = currentmesh.geometry.attributes.position.array;
        var midpt = new THREE.Vector3((arr[0] + arr[3]) / 2, (arr[1] + arr[4]) / 2, (arr[2] + arr[5]) / 2);
        CreateSphereGeometrywithpoint(midpt);
    }
    else if (DrawGeometry == options.COINCIDENTPLANE) {
        if (firstplaneselected) {
            let selectedplane = checkifplaneselected(intersection);
            if (selectedplane == -1)
                return;
            firstplaneselected = false;
            selectedObject = currentmesh;
        }
        //Working for movement
        else {
            let selectedplane = checkifplaneselected(intersection);
            if (selectedplane == -1)
                return;
            firstplaneselected = true;

            let nrm1 = calculateNormals(selectedObject);
            nrm1.normalize();
            let nrm2 = calculateNormals(currentmesh);
            nrm2.normalize();
            let rotationaxis = nrm1.clone().cross(nrm2.clone());
            rotationaxis.normalize();
            let angle = nrm1.clone().angleTo(nrm2);

            let plane = new THREE.Plane();
            let projectedpt = new THREE.Vector3();
            plane.setFromNormalAndCoplanarPoint(nrm1, selectedObject.position.clone());
            plane.projectPoint(currentmesh.position.clone(), projectedpt);
            if (currentmesh.parent == implantgroup)  //Checking for implantgroup
            {
                if (undefined != implantgroup) {
                    implantgroup.rotateOnWorldAxis(rotationaxis, -angle);
                    implantgroup.position.set(projectedpt.x, projectedpt.y, projectedpt.z);
                }
            }
            else {
                currentmesh.rotateOnWorldAxis(rotationaxis, -angle);
                currentmesh.position.set(projectedpt.x, projectedpt.y, projectedpt.z);
            }
        }
    }
    else if (DrawGeometry == options.NORMALTOPLANE) {
        let selectedplane = checkifplaneselected(intersection);
        if (selectedplane == -1)
            return;

        let planenormal = calculateNormals(currentmesh);
        if (selectedent == selectionon.GROUP)
            currentmesh = implantgroup;
        let campos = currentmesh.position.clone().add(planenormal.multiplyScalar(800));
        camera.position.set(campos.x, campos.y, campos.z);
        let bbox = new THREE.Box3();
        bbox.setFromObject(group);

        camera.lookAt(currentmesh.position.x, currentmesh.position.y, currentmesh.position.z);
        controls.target.set(currentmesh.position.x, currentmesh.position.y, currentmesh.position.z);
    }
    else if (DrawGeometry == options.INVERTDIRECTION)// Add functionaility for selecting a starting point
    {
        let selectedline = checkiflineselected(intersection);
        if (selectedline == -1)
            return;
        var arr = currentmesh.geometry.attributes.position.array;
        let frompoint = new THREE.Vector3(arr[0], arr[1], arr[2]);
        let topoint = new THREE.Vector3(arr[3], arr[4], arr[5]);
        let dist = frompoint.distanceTo(topoint);//distance of 2nd line
        let uvector = frompoint.clone().sub(topoint);
        uvector.normalize();
        let nextpoint = frompoint.clone().add(uvector.multiplyScalar(dist));
        CreateSphereGeometrywithpoint(nextpoint);
        CreateProjectedLine(frompoint, nextpoint);
        frompoint.sub(topoint);
    }
    else if (DrawGeometry == options.LINESELECTION) {
        if (firstlineselected) {
            let selectedline = checkiflineselected(intersection);
            if (selectedline == -1)
                return;
            firstlineselected = false;
            firstpointselected = true;
            changeColour(currentmesh);
            var arr = currentmesh.geometry.attributes.position.array;
            linepoints[0] = new THREE.Vector3(arr[0], arr[1], arr[2]);
            linepoints[1] = new THREE.Vector3(arr[3], arr[4], arr[5]);
        }
        else if (firstpointselected) {
            let selectedpoint = checkifpointselected(intersection);
            if (selectedpoint == -1)
                return;
            CreatePlane(currentmesh.position);
        }
    }
    //Plane selection
    else if (DrawGeometry == options.SELECTION) {
        // let i = 0;
        // while (i < intersection.length) {
        //     if (intersection[i].object.name == "") {
        //         i++;
        //         continue;
        //     }
        //     else {
        //         break;
        //     }
        // }
        // if (i >= intersection.length)
        //     return;
        intersection[0].object.material.color.setHex(0xffff00);
        currentmesh = intersection[0].object;

        Fillindetails(currentmesh);
        if (selectedent == selectionon.GROUP)
            currentmesh = implantgroup;
        if (transformControl.enabled) {
            transformControl.detach();
        }
        statsupdated = true;
        transformControl.attach(currentmesh);
        updatetransformcontrol(currentmesh);
        scene.add(transformControl);
    }
    else if (DrawGeometry == options.POINT) {
        const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xfef000 });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.copy(intersection[0].point);
        sphere.scale.multiplyScalar(0.98);
        sphere.scale.clampScalar(0.01, 1);
        POINTS.push(sphere);
        scene.add(sphere);
        updateform(sphere)
    }
    else if (DrawGeometry == options.POINTSELECT) {
        if (firstpointselected) {
            let selectedpoint = checkifpointselected(intersection);
            if (selectedpoint == -1)
                return;
            linepoints[0] = currentmesh.position;
            firstpointselected = false;
        }
        else {
            let selectedpoint = checkifpointselected(intersection);
            if (selectedpoint == -1)
                return;

            if (linepoints[0] == currentmesh.position)
                return;
            linepoints[1] = currentmesh.position;
            currentmesh.material.color.setHex(0x00ff00);
            firstpointselected = true;
            CreateLine();
        }
    }
    else if (DrawGeometry == options.POINTSELECTFORTIBIA) {
        let firstpoint = scene.getObjectByName("Proximal Tibia", true);
        if (firstpointselected) {
            let selectedpoint = checkifpointselected(intersection);
            if (selectedpoint == -1)
                return;
            
            linepoints[0] = currentmesh.position;
            linepoints[1] = firstpoint.position;
            firstpointselected = false;
            CreateLine("CurvedAreaLine1");
        }
        else {
            let selectedpoint = checkifpointselected(intersection);
            if (selectedpoint == -1)
                return;

            if (linepoints[0] == currentmesh.position)
                return;
            linepoints[1] = currentmesh.position;
            linepoints[0] = firstpoint.position;
            currentmesh.material.color.setHex(0x00ff00);
            firstpointselected = true;
            CreateLine("CurvedAreaLine2");
        }
    }
    else if (DrawGeometry == options.STLSELECTION) {
        intersection[0].object.material.color.setHex(0xffff00);
        currentmesh = intersection[0].object;
        if (transformControl.enabled) {
            transformControl.detach();
        }
        transformControl.attach(currentmesh);
        scene.add(transformControl);
    }
    else if (DrawGeometry == options.MAKEPERPENDICULAR) {
        if (firstlineselected) {

            let selectedline = checkiflineselected(intersection);
            if (selectedline == -1)
                return;
            firstlineselected = false;
            changeColour(currentmesh);
            selectedObject = currentmesh.clone();
        }
        else {
            let selectedline = checkiflineselected(intersection);
            if (selectedline == -1)
                return;

            firstlineselected = true;
            //Take the first Line 
            let twopointsinarray = selectedObject.geometry.attributes.position.array;
            let firstlinevector = new THREE.Vector3(twopointsinarray[3] - twopointsinarray[0], twopointsinarray[4] - twopointsinarray[1], twopointsinarray[5] - twopointsinarray[2]);

            twopointsinarray = currentmesh.geometry.attributes.position.array;
            let frompoint = new THREE.Vector3(twopointsinarray[0], twopointsinarray[1], twopointsinarray[2]);
            let topoint = new THREE.Vector3(twopointsinarray[3], twopointsinarray[4], twopointsinarray[5]);
            let dist = frompoint.distanceTo(topoint);//distance of 2nd line
            let firstptvector = new THREE.Vector3(twopointsinarray[0], twopointsinarray[1], twopointsinarray[2]);

            let secondlinevector = new THREE.Vector3(twopointsinarray[3] - twopointsinarray[0], twopointsinarray[4] - twopointsinarray[1], twopointsinarray[5] - twopointsinarray[2]);

            var thirdvector = new THREE.Vector3();
            thirdvector.crossVectors(firstlinevector.clone(), secondlinevector.clone());

            let dirvector = new THREE.Vector3();
            dirvector.crossVectors(thirdvector.clone(), firstlinevector.clone());
            dirvector.normalize();
            var finalptvect = firstptvector.clone().add(dirvector.multiplyScalar(dist));
            CreateSphereGeometrywithpoint(finalptvect);
            CreateProjectedLine(firstptvector, finalptvect);
        }
    }

    else if (DrawGeometry == options.MAKEPARALLEL) {
        if (firstlineselected) {
            let selectedline = checkiflineselected(intersection);
            if (selectedline == -1)
                return;

            firstlineselected = false;
            changeColour(currentmesh);
            selectedObject = currentmesh.clone();
        }
        else {
            let selectedline = checkiflineselected(intersection);
            if (selectedline == -1)
                return;

            firstlineselected = true;
            let twopointsinarray = currentmesh.geometry.attributes.position.array;
            let frompoint = new THREE.Vector3(twopointsinarray[0], twopointsinarray[1], twopointsinarray[2]);
            let topoint = new THREE.Vector3(twopointsinarray[3], twopointsinarray[4], twopointsinarray[5]);
            let dist = frompoint.distanceTo(topoint);

            let initiallinepoints = selectedObject.geometry.attributes.position.array;
            var uvector = new THREE.Vector3(initiallinepoints[0] - initiallinepoints[3], initiallinepoints[1] - initiallinepoints[4], initiallinepoints[2] - initiallinepoints[5]);
            uvector.normalize();

            var newpt = frompoint.clone().add(uvector.multiplyScalar(dist));
            CreateSphereGeometrywithpoint(newpt);
            CreateProjectedLine(frompoint, newpt);
        }
    }

    else if (DrawGeometry == options.PROJECTLINEONPLANE) {
        if (firstlineselected) {
            let selectedline = checkiflineselected(intersection);
            if (selectedline == -1)
                return;
            changeColour(currentmesh);

            selectedObject = currentmesh.clone();
            firstlineselected = false;
        }
        else {
            let selectedplane = checkifplaneselected(intersection);
            if (selectedplane == -1)
                return;

            firstlineselected = true;
            let planemesh = currentmesh.clone();
            ProjectLineOnPlane(selectedObject, planemesh, intersection[0].object);
        }
    }
    //Set the change colour options and change form option
    if (DrawGeometry != options.DRAWPOINT)
        Fillindetails(currentmesh);
}




function DisplaySphereGeometryproperties(mesh) {
    changeColour(mesh);
    let meshposwcs = new THREE.Vector3();
    mesh.getWorldPosition(meshposwcs);

    document.getElementById("Pointname").value = mesh.name;
    document.getElementById("XPointPos").value = Math.round((meshposwcs.x + Number.EPSILON) * 10000) / 10000;
    document.getElementById("YPointPos").value = Math.round((meshposwcs.y + Number.EPSILON) * 10000) / 10000;
    document.getElementById("ZPointPos").value = Math.round((meshposwcs.z + Number.EPSILON) * 10000) / 10000;
    document.getElementById("LineForm").style.display = "none";
    document.getElementById("PlaneForm").style.display = "none";
    document.getElementById("PointForm").style.display = "block";
}

function DisplayLineGeometryproperties(mesh) {
    changeColour(mesh);
    let meshposwcs = new THREE.Vector3();
    mesh.getWorldPosition(meshposwcs);
    var arr = mesh.geometry.attributes.position.array;
    let vec1 = new THREE.Vector3(arr[0], arr[1], arr[2]);
    let vec2 = new THREE.Vector3(arr[3], arr[4], arr[5]);
    document.getElementById("Linename").value = mesh.name;
    document.getElementById("XfirstptPos").value = Math.round((arr[0] + Number.EPSILON) * 10000) / 10000;
    document.getElementById("YfirstptPos").value = Math.round((arr[1] + Number.EPSILON) * 10000) / 10000;
    document.getElementById("ZfirstptPos").value = Math.round((arr[2] + Number.EPSILON) * 10000) / 10000;
    document.getElementById("XsecondptPos").value = Math.round((arr[3] + Number.EPSILON) * 10000) / 10000;
    document.getElementById("YsecondptPos").value = Math.round((arr[4] + Number.EPSILON) * 10000) / 10000;
    document.getElementById("ZsecondptPos").value = Math.round((arr[5] + Number.EPSILON) * 10000) / 10000;

    document.getElementById("Linelength").value = Math.round((vec1.distanceTo(vec2) + Number.EPSILON) * 10000) / 10000;
    document.getElementById("LineForm").style.display = "block";
    document.getElementById("PlaneForm").style.display = "none";
    document.getElementById("PointForm").style.display = "none";
}

function DisplayPlaneGeometryproperties(mesh) {
    changeColour(mesh);
    let meshposwcs = new THREE.Vector3();
    mesh.getWorldPosition(meshposwcs);
    var quaternion = new THREE.Quaternion()
    mesh.getWorldQuaternion(quaternion)

    let meshrotation = new THREE.Euler()
    meshrotation.setFromQuaternion(quaternion)
    document.getElementById("PlaneForm").style.display = "block";
    document.getElementById("Planename").value = mesh.name;
    //Rotation
    document.getElementById("XPlaneAngle").value = THREE.Math.radToDeg(Math.round((meshrotation.x + Number.EPSILON) * 10000) / 10000).toFixed(2);
    document.getElementById("YPlaneAngle").value = THREE.Math.radToDeg(Math.round((meshrotation.y + Number.EPSILON) * 10000) / 10000).toFixed(2);
    document.getElementById("ZPlaneAngle").value = THREE.Math.radToDeg(Math.round((meshrotation.z + Number.EPSILON) * 10000) / 10000).toFixed(2);

    //Position
    document.getElementById("XPlanePosition").value = (Math.round((meshposwcs.x + Number.EPSILON) * 10000) / 10000).toFixed(2);
    document.getElementById("YPlanePosition").value = (Math.round((meshposwcs.y + Number.EPSILON) * 10000) / 10000).toFixed(2);
    document.getElementById("ZPlanePosition").value = (Math.round((meshposwcs.z + Number.EPSILON) * 10000) / 10000).toFixed(2);


    let FlexionDistalPlane = scene.getObjectByName("FlexionDistalPlane", true)
    if (mesh == FlexionDistalPlane) {
        let distalplane = scene.getObjectByName("Axial - Mech Axis - Rod inst", true)
        if (undefined == distalplane)
            return;

        let nrm1 = calculateNormals(FlexionDistalPlane);
        let nrm2 = calculateNormals(distalplane);
        let angle = nrm1.angleTo(nrm2);
        document.getElementById("Deflection").value = THREE.Math.radToDeg(angle);
        document.getElementById("Deflection").style.display = "block";
    }
    document.getElementById("LineForm").style.display = "none";
    document.getElementById("PointForm").style.display = "none";
    document.getElementById("PlaneForm").style.display = "block";
}

function Fillindetails(mesh) {

    if (statsupdated) {
        statsupdated = false;
        return;
    }
    if (DrawGeometry == options.MEASURE) {
        document.getElementById("LineForm").style.display = "none";
        document.getElementById("PlaneForm").style.display = "none";
        document.getElementById("PointForm").style.display = "none";
        return;
    }
    document.getElementById("MeasurementForm").style.display = "none";
    if (mesh.geometry.type == "SphereGeometry") {
        DisplaySphereGeometryproperties(mesh);
    }
    else if (mesh.type == "Line") {
        DisplayLineGeometryproperties(mesh);
    }
    else if (mesh.geometry.type == "PlaneGeometry") {
        DisplayPlaneGeometryproperties(mesh);
    }
}

transformControl.addEventListener('change', render);
transformControl.addEventListener('dragging-changed', function (event) {
    UpdateCurrentMeshparameters();
});

document.getElementById("canvas-container").onmouseover = function (e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;
    checkForPointIntersectionOnHover();
}
//Need  to fix this
function checkForPointIntersectionOnHover() {
    raycaster.setFromCamera(mouse, camera);
    const intersection = raycaster.intersectObjects(POINTS);
    if (intersection.length > 0) {
        //var newMesh = intersection[0].object.clone();
        intersection[0].object.material.color.setHex(0x00ff00);
        prevmesh = intersection[0].object;
    }
    else {
        if (prevmesh)
            prevmesh.material.color.setHex(0xff0000);
    }
}

function CreatePlane(spherepos, PlaneName) {
    var pos = scene.position;
    var uvector = new THREE.Vector3(linepoints[0].x - linepoints[1].x, linepoints[0].y - linepoints[1].y, linepoints[0].z - linepoints[1].z);
    uvector.normalize();

    const pg = new THREE.PlaneGeometry(100, 100);
    const pm = new THREE.MeshBasicMaterial({ color: 0xef00ab, side: THREE.DoubleSide, opacity: 0.1, transparent: true });

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
    AddParentForJSTREE(meshy);
    scene.add(meshy);
}
function CreateLine(Linename, GroupName) {
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
    if (undefined == GroupName)
        scene.add(line);
    else {
        implantgroup.add(line)
    }
    line.geometry.verticesNeedUpdate = true;
}

function CreateTransformControls() {

    if (undefined != transformControl)
        transformControl.dispose()
    transformControl = new TransformControls(camera, renderer.domElement);
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
            //No used case found but still keeping it
            case 's': // S
                transformControl.setMode("scale");
                break;
        }
    });
}

function CreateRenderer() {
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    renderer.shadowMap.enabled = true;
    renderer.autoClear = true;
    renderer.alpha = true;
}

function CreateCamera() {
    const ASPECT_RATIO = (window.innerWidth) / (window.innerHeight);
    let WIDTH = (window.innerWidth) * window.devicePixelRatio;
    let HEIGHT = (window.innerHeight) * window.devicePixelRatio;
    camera = new THREE.PerspectiveCamera(40, ASPECT_RATIO, 0.1, 10000);
    camera.viewport = new THREE.Vector4(Math.floor(WIDTH), Math.floor(HEIGHT), Math.ceil(WIDTH), Math.ceil(HEIGHT));
    scene.add(camera);
    orthoCamera = new THREE.OrthographicCamera();
}

function CreateTrackballControls() {
    if (undefined != controls)
        controls.dispose();
    controls = new TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 2.0;
}

function AddLightsToScene() {
    const light = new THREE.DirectionalLight();
    light.position.set(0.5, 0.5, 1);
    scene.add(light);
    const light1 = new THREE.DirectionalLight();
    light1.position.set(-0.5, -0.5, -1);
    scene.add(light1);
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
            // transparent: true,
            side: THREE.DoubleSide,
            clippingPlanes: Planearray
        });

        desgeometry = new THREE.Geometry().fromBufferGeometry(desgeometry);
        const clippedColorFront = new THREE.Mesh(desgeometry, material);
        clippedColorFront.position.set(0,0,0)

        clippedColorFront.castShadow = true;
        clippedColorFront.renderOrder = 20;
        // if (undefined == object) {
        //     object = new THREE.Group();
        //     scene.add(object);
        // }
        //object.add(clippedColorFront);
        // const stencilGroup = createPlaneStencilGroup( geometry, Planearray, count );
        material.side = THREE.DoubleSide;
        //group.add(stencilGroup);
        // const mesh = new THREE.Mesh(geometry, material);
        clippedColorFront.geometry.computeBoundingBox();
        clippedColorFront.updateMatrixWorld(true);
        // let csgPrimaryCube = new ThreeBSP(clippedColorFront);
        // csgPrimaryCube=csgPrimaryCube.toMesh();
        // csgPrimaryCube.material=material.clone();
        group.add(clippedColorFront);

        // const clippedColorFront = new THREE.Mesh( geometry, material );
        // clippedColorFront.castShadow = true;
        // clippedColorFront.renderOrder = 6;
        // group.add( clippedColorFront );

        let bbox = new THREE.Box3();
        bbox.setFromObject(group);
        camera.lookAt(bbox.getCenter().x, bbox.getCenter().y, bbox.getCenter().z);
        controls.target.set(bbox.getCenter().x, bbox.getCenter().y, bbox.getCenter().z);
        //         const box = new THREE.BoxHelper( group, 0xff0000 );
        // scene.add( box );
    },
    (error) => {
        console.log(error);
    });

}
function CalculateCenter() {
    var center = new THREE.Vector3();
    var children = group.children;
    var count = children.length;
    for (var i = 0; i < count; i++) {
        mesh.geometry.computeBoundingBox();
        center.add(children[i].position);
    }
    center.divideScalar(count);
    return center;
}

function initStats() {
    stats = new Stats();
    // stats.showPanel( 1 );
    stats.setMode(0); // 0: fps, 1: ms
    // Align top-left
    stats.showPanel();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '300%';
    stats.domElement.style.top = '0px';
    document.getElementById("Stats-output").appendChild(stats.dom);
}

function init() {

    CreateRenderer();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x808080); // Set background color to blue
    CreateCamera();
    AddLightsToScene();
    CreateTransformControls();
    renderer.setAnimationLoop(render);
    container = document.getElementById('canvas-container');
    container.appendChild(renderer.domElement);
    CreateTrackballControls();
    // setupInset();
    // initStats();
    LoadPoints();
}

function createPlaneStencilGroup(geometry, plane, renderOrder) {

    const ggroup = new THREE.Group();
    const baseMat = new THREE.MeshBasicMaterial();
    baseMat.depthWrite = false;
    baseMat.depthTest = false;
    baseMat.colorWrite = false;
    baseMat.stencilWrite = true;
    baseMat.stencilFunc = THREE.AlwaysStencilFunc;

    // back faces
    const mat0 = baseMat.clone();
    mat0.side = THREE.BackSide;
    mat0.clippingPlanes = [plane];
    mat0.stencilFail = THREE.IncrementWrapStencilOp;
    mat0.stencilZFail = THREE.IncrementWrapStencilOp;
    mat0.stencilZPass = THREE.IncrementWrapStencilOp;

    const mesh0 = new THREE.Mesh(geometry, mat0);
    mesh0.renderOrder = renderOrder;
    ggroup.add(mesh0);

    // front faces
    const mat1 = baseMat.clone();
    mat1.side = THREE.FrontSide;
    mat1.clippingPlanes = [plane];
    mat1.stencilFail = THREE.DecrementWrapStencilOp;
    mat1.stencilZFail = THREE.DecrementWrapStencilOp;
    mat1.stencilZPass = THREE.DecrementWrapStencilOp;

    const mesh1 = new THREE.Mesh(geometry, mat1);
    mesh1.renderOrder = renderOrder;

    ggroup.add(mesh1);

    return ggroup;

}

function LoadPoints() {
    let pt1 = new THREE.Vector3(-14.9899997, -28.4611791, 16.1614773010);
    CreateSphereGeometrywithpoint1(pt1, "pt1");
    let pt2 = new THREE.Vector3(-14.989999, -8.951738, 17.2496);
    CreateSphereGeometrywithpoint1(pt2, "pt2");
    let pt3 = new THREE.Vector3(-14.989999, 28.388741, 17.7373951);
    CreateSphereGeometrywithpoint1(pt3, "pt3");

    let pt4 = new THREE.Vector3(-10.5111908, -29.079042, 4.6461911);
    CreateSphereGeometrywithpoint1(pt4, "pt4");
    let pt5 = new THREE.Vector3(-12.83310, -8.749996, 6.968101);
    CreateSphereGeometrywithpoint1(pt5, "pt5");
    let pt6 = new THREE.Vector3(-12.5467651, 28.826139, 6.6817652);
    CreateSphereGeometrywithpoint1(pt6, "pt6");

    let pt7 = new THREE.Vector3(0.00477176, 17.78, 0.00);
    CreateSphereGeometrywithpoint1(pt7, "pt7");
    let pt8 = new THREE.Vector3(0.00477176, -17.78, 0.00);
    CreateSphereGeometrywithpoint1(pt8, "pt8");
    let pt9 = new THREE.Vector3(-33.41918618, 0.00, 0.00);
    CreateSphereGeometrywithpoint1(pt9, "pt9");

    let pt10 = new THREE.Vector3(17.8665092, -21.1462811, 8.4793525);
    CreateSphereGeometrywithpoint1(pt10, "pt10");
    let pt11 = new THREE.Vector3(17.310538, -10.0341981, 7.9233805534);
    CreateSphereGeometrywithpoint1(pt11, "pt11");
    let pt12 = new THREE.Vector3(18.64995, 24.18053, 9.26279478);
    CreateSphereGeometrywithpoint1(pt12, "pt12");

    let pt13 = new THREE.Vector3(23.4243, 4.64435296, 28.2188674);
    CreateSphereGeometrywithpoint1(pt13, "pt13");
    let pt14 = new THREE.Vector3(22.920655, -12.822660, 23.426444314);
    CreateSphereGeometrywithpoint1(pt14, "pt14");
    let pt15 = new THREE.Vector3(22.9386647, 21.9379470, 23.597786534);
    CreateSphereGeometrywithpoint1(pt15, "pt15");
}
function CreateSphereGeometrywithpoint1(point, SphereName) {
    const geometry = new THREE.SphereGeometry(0.1, 64, 64);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(geometry, material);
    if (undefined == implantgroup)
        implantgroup = new THREE.Group();
    implantgroup.add(sphere);
    if (undefined != SphereName)
        sphere.name = SphereName;
    currentmesh = sphere.clone();
    sphere.position.set(point.x, point.y, point.z);
    scene.add(sphere)
}

document.getElementById("Clip").onclick = function (e) {
    createPlanesusingPts();
    let len = group.children.length;
    for (let j = 0; j < 0; j++) {// Approach 1 for testing 
        let pplane = Planearray[j];
        planeObjects = [];
        for (let i = 0; i < len; i++) {

            const poGroup = new THREE.Group();
            const stencilGroup = createPlaneStencilGroup(group.children[i].geometry.clone(), pplane, i + 1);
            const planeMat =
                new THREE.MeshStandardMaterial({

                    color: 0xE91E63,
                    metalness: 0.1,
                    roughness: 0.75,
                    clippingPlanes: Planearray.filter(p => p !== pplane),

                    stencilWrite: true,
                    stencilRef: 0,
                    stencilFunc: THREE.NotEqualStencilFunc,
                    stencilFail: THREE.ReplaceStencilOp,
                    stencilZFail: THREE.ReplaceStencilOp,
                    stencilZPass: THREE.ReplaceStencilOp,

                });
            const po = new THREE.Mesh(planeGeom, planeMat);
            po.onAfterRender = function (renderer) {
                renderer.clearStencil();
            };

            po.renderOrder = j + 1.1;

            group.add(stencilGroup);
            poGroup.add(po);
            planeObjects.push(po);
            scene.add(poGroup);


            const material = new THREE.MeshStandardMaterial({

                color: 0xFFC107,
                metalness: 1,
                roughness: 1,
                clippingPlanes: Planearray,
                clipShadows: true,
                shadowSide: THREE.DoubleSide,

            });

            // add the color
            const clippedColorFront = new THREE.Mesh(group.children[i].geometry.clone(), material);
            clippedColorFront.renderOrder = 6;
            group.add(clippedColorFront);
        }
    }

    for (let j = 0; j < 5; j++) {//Planearray.length; j++) {
        let pplane = Planearray[j];
        for (let i = 0; i < group.children.length; i++) {

            var frontFaceStencilMat, backFaceStencilMat, planeStencilMat;

            // PASS 1
            // everywhere that the back faces are visible (clipped region) the stencil
            // buffer is incremented by 1.
            backFaceStencilMat = new THREE.MeshBasicMaterial();
            backFaceStencilMat.depthWrite = false;
            backFaceStencilMat.depthTest = false;
            backFaceStencilMat.colorWrite = false;
            backFaceStencilMat.stencilWrite = true;

            backFaceStencilMat.stencilFunc = THREE.AlwaysStencilFunc;
            backFaceStencilMat.side = THREE.BackSide;
            backFaceStencilMat.stencilFail = THREE.IncrementWrapStencilOp;
            backFaceStencilMat.stencilZFail = THREE.IncrementWrapStencilOp;
            backFaceStencilMat.stencilZPass = THREE.IncrementWrapStencilOp;

            // PASS 2
            // everywhere that the front faces are visible the stencil
            // buffer is decremented back to 0.

            frontFaceStencilMat = new THREE.MeshBasicMaterial();
            frontFaceStencilMat.depthWrite = false;
            frontFaceStencilMat.depthTest = false;
            frontFaceStencilMat.colorWrite = false;
            frontFaceStencilMat.stencilWrite = true;
            frontFaceStencilMat.stencilFunc = THREE.AlwaysStencilFunc;
            frontFaceStencilMat.side = THREE.FrontSide;
            frontFaceStencilMat.stencilFail = THREE.DecrementWrapStencilOp;
            frontFaceStencilMat.stencilZFail = THREE.DecrementWrapStencilOp;
            frontFaceStencilMat.stencilZPass = THREE.DecrementWrapStencilOp;
            planeStencilMat =
                new THREE.MeshBasicMaterial({
                    opacity: 1,
                    stencilWrite: true,
                    stencilRef: 0,
                    stencilFunc: THREE.NotEqualStencilFunc,
                    stencilFail: THREE.ReplaceStencilOp,
                    stencilZFail: THREE.ReplaceStencilOp,
                    stencilZPass: THREE.ReplaceStencilOp

                });
            frontFaceStencilMat.clippingPlanes = [pplane];
            backFaceStencilMat.clippingPlanes = [pplane];
            var frontMesh = new THREE.Mesh(group.children[i].geometry.clone(), frontFaceStencilMat);
            frontMesh.rotation.copy(group.children[i].rotation);
            scene.add(frontMesh);
            var backMesh = new THREE.Mesh(group.children[i].geometry.clone(), backFaceStencilMat);
            backMesh.rotation.copy(group.children[i].rotation);
            scene.add(backMesh);

            var planeGeom = new THREE.PlaneGeometry(20, 20);
            var planeMesh = new THREE.Mesh(planeGeom, planeStencilMat);
            planeMesh.scale.setScalar(100);
            pplane.coplanarPoint(planeMesh.position);
            planeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1).normalize(), pplane.normal.clone().negate());
            planeMesh.renderOrder = j + 1;
            scene.add(planeMesh);
            planeMesh.onAfterRender = function (renderer) {
                renderer.clearStencil();
            };
        }
    }
    //InitResectioningRendering();
    renderer.localClippingEnabled = true;
    document.getElementById("Distancefromtwoends").style.display = "block";
}

function initStencilMaterials(plane) {
    // PASS 1
    // everywhere that the back faces are visible (clipped region) the stencil
    // buffer is incremented by 1.
    backFaceStencilMat = new THREE.MeshBasicMaterial();
    backFaceStencilMat.depthWrite = false;
    backFaceStencilMat.depthTest = false;
    backFaceStencilMat.colorWrite = false;
    backFaceStencilMat.stencilWrite = true;

    backFaceStencilMat.stencilFunc = THREE.AlwaysStencilFunc;
    backFaceStencilMat.side = THREE.BackSide;
    backFaceStencilMat.stencilFail = THREE.IncrementWrapStencilOp;
    backFaceStencilMat.stencilZFail = THREE.IncrementWrapStencilOp;
    backFaceStencilMat.stencilZPass = THREE.IncrementWrapStencilOp;

    // PASS 2
    // everywhere that the front faces are visible the stencil
    // buffer is decremented back to 0.
    frontFaceStencilMat = new THREE.MeshBasicMaterial();
    frontFaceStencilMat.depthWrite = false;
    frontFaceStencilMat.depthTest = false;
    frontFaceStencilMat.colorWrite = false;
    frontFaceStencilMat.stencilWrite = true;
    frontFaceStencilMat.stencilFunc = THREE.AlwaysStencilFunc;
    frontFaceStencilMat.side = THREE.FrontSide;
    frontFaceStencilMat.stencilFail = THREE.DecrementWrapStencilOp;
    frontFaceStencilMat.stencilZFail = THREE.DecrementWrapStencilOp;
    frontFaceStencilMat.stencilZPass = THREE.DecrementWrapStencilOp;

    // PASS 3
    // draw the plane everywhere that the stencil buffer != 0, which will
    // only be in the clipped region where back faces are visible.


    planeStencilMat =
        new THREE.MeshPhongMaterial({

            color: 0xffdead,
            opacity: 0.5,
            transparent: true,
            stencilWrite: true,
            stencilRef: 0,
            side: THREE.DoubleSide,
            stencilFunc: THREE.NotEqualStencilFunc,
            stencilFail: THREE.ReplaceStencilOp,
            stencilZFail: THREE.ReplaceStencilOp,
            stencilZPass: THREE.ReplaceStencilOp,

        });
}



document.getElementById("UnClip").onclick = function (e) {
    while (Planearray.length > 0) {
        Planearray.pop();
    }
    //renderer.clippingPlanes = Empty;
    renderer.localClippingEnabled = false;
    //renderer.clearStencil();
    document.getElementById("Distancefromtwoends").style.display = "none";
    showCaps = false;
}

function InitResectioningRendering() {

    let len = group.children.length;
    planeObjects = [];
    for (let g1 = 0; g1 < len; g1++) {
        for (let i = 0; i < Planearray.length; i++) {
            const poGroup = new THREE.Group();
            const pl = Planearray[i];
            const stencilGroup = createPlaneStencilGroup(group.children[g1].geometry, pl, i + 1);

            const planeGeom = new THREE.PlaneGeometry(100, 100);
            // plane is clipped by the other clipping planes
            const planeMat =
                new THREE.MeshStandardMaterial({

                    color: 0xFFDEAD,
                    metalness: 0.1,
                    roughness: 0.75,
                    clippingPlanes: Planearray.filter(p => p !== pl),

                    stencilWrite: true,
                    stencilRef: 0,
                    stencilFunc: THREE.AlwaysStencilFunc,
                    stencilFail: THREE.ReplaceStencilOp,
                    // stencilZFail: THREE.ReplaceStencilOp,
                    // stencilZPass: THREE.ReplaceStencilOp,

                });


            const po = new THREE.Mesh(planeGeom, planeMat);
            po.renderOrder = i + 1.1;

            group.add(stencilGroup);
            poGroup.add(po);
            planeObjects.push(po);
            scene.add(poGroup);
        }
    }
}

function createPlanesusingPts() {
    document.getElementById("MeasurementForm").style.display = "none";
    document.getElementById("LineForm").style.display = "none";
    document.getElementById("PlaneForm").style.display = "none";
    document.getElementById("PointForm").style.display = "none";

    while (Planearray.length > 0) {
        Planearray.pop();
    }
    for (let i = 0; i < 5; i++) {
        let name = "pt" + (i * 3 + 1);
        let pt1 = scene.getObjectByName(name, true);
        if (undefined == pt1)
            continue;

        name = "pt" + (i * 3 + 2);
        let pt2 = scene.getObjectByName(name, true);
        if (undefined == pt2)
            continue;

        name = "pt" + (i * 3 + 3);
        let pt3 = scene.getObjectByName(name, true);
        if (undefined == pt3)
            continue;
        let vec1 = new THREE.Vector3();
        let vec2 = new THREE.Vector3();
        let vec3 = new THREE.Vector3();

        pt1.getWorldPosition(vec1);
        pt2.getWorldPosition(vec2);
        pt3.getWorldPosition(vec3);

        let firstaxis = vec1.clone().sub(vec2.clone());
        let secondaxis = vec1.clone().sub(vec3.clone());
        let nrm = firstaxis.cross(secondaxis);
        nrm.normalize();

        let plane = new THREE.Plane();
        // if(i==4 )
        // plane.setFromNormalAndCoplanarPoint(nrm.clone(),vec1);
        // else
        plane.setFromNormalAndCoplanarPoint(nrm.clone().negate(), vec1);
        Planearray.push(plane);
        if (2 == i) {

            //distance from distal end
            let DistalMedialExtent = scene.getObjectByName("Distal Medial Extent", true);
            let DistalLateralExtent = scene.getObjectByName("Distal Lateral Extent", true);
            let dist1 = plane.distanceToPoint(DistalMedialExtent.position.clone());
            let dist2 = plane.distanceToPoint(DistalLateralExtent.position.clone());
            dist1 = Math.abs(dist1);
            dist2 = Math.abs(dist2);

            document.getElementById("DistalMedialCutDistance").value = Math.round((dist1 + Number.EPSILON) * 1000) / 1000;
            document.getElementById("DistalLateralCutDistance").value = Math.round((dist2 + Number.EPSILON) * 1000) / 1000;
        }
        if (0 == i) {
            let PostMedialExtent = scene.getObjectByName("Post Medial Extent", true);
            let PostLateralExtent = scene.getObjectByName("Post Lateral Extent", true);
            let dist1 = plane.distanceToPoint(PostMedialExtent.position.clone());
            let dist2 = plane.distanceToPoint(PostLateralExtent.position.clone());
            dist1 = Math.abs(dist1);
            dist2 = Math.abs(dist2);
            document.getElementById("PostLateralCutDistance").value = Math.round((dist2 + Number.EPSILON) * 1000) / 1000;
            document.getElementById("PostMedialCutDistance").value = Math.round((dist1 + Number.EPSILON) * 1000) / 1000;
        }
    }
}

// function setupInset() {

//     const insetWidth = 150, insetHeight = 150;
//     container2 = document.getElementById('inset');
//     container2.width = insetWidth;
//     container2.height = insetHeight;

//     // renderer
//     renderer2 = new THREE.WebGLRenderer({ alpha: true, antialias: true });
//     renderer2.setClearColor(0x000000, 0);
//     renderer2.setSize(insetWidth, insetHeight);
//     container2.appendChild(renderer2.domElement);

//     // scene
//     scene2 = new THREE.Scene();

//     // camera
//     camera2 = new THREE.PerspectiveCamera(50, insetWidth / insetHeight, 1, 1000);
//     camera2.up = camera.up; // important!

//     // axes
//     axes2 = new THREE.AxesHelper(100);
//     scene2.add(axes2);

// }

function UpdateCurrentMeshparameters() {
    if (currentmesh == undefined)
        return;
    //rotation values
    document.getElementById("XPlaneAngle").value = THREE.Math.radToDeg(currentmesh.rotation.x).toFixed(2);
    document.getElementById("YPlaneAngle").value = THREE.Math.radToDeg(currentmesh.rotation.y).toFixed(2);
    document.getElementById("ZPlaneAngle").value = THREE.Math.radToDeg(currentmesh.rotation.z).toFixed(2);

    //position values
    document.getElementById("XPlanePosition").value = (currentmesh.position.x).toFixed(2);
    document.getElementById("YPlanePosition").value = (currentmesh.position.y).toFixed(2);
    document.getElementById("ZPlanePosition").value = (currentmesh.position.z).toFixed(2);

}

function animate() {
    requestAnimationFrame(animate);
    // camera2.position.copy(camera.position);
    // camera2.position.sub(controls.target);
    // camera2.position.setLength(300);
    // camera2.lookAt(scene2.position);
    render();
}
function render() {


    renderer.render(scene, camera);
    // renderer2.render(scene2, camera2);
    // stats.update();
    controls.update();
}

export default LoadModels;
