const ParticleApp=function(){let e={activeLayerId:null,layers:[],nextLayerId:1,isProcessing:!1,renderer:null,scene:null,camera:null,controls:null,composer:null,bloomPass:null,simplex:null,mousePosition:new THREE.Vector3,mouseMoved:!1,lastFrameTime:0,frameCounter:0,fps:0,fpsUpdateTime:0,particleCount:0,rigidBody:{active:!1,position:new THREE.Vector3(0,0,0),size:30,force:10,returnSpeed:1,mesh:null}},t={sceneContainer:document.getElementById("scene-container"),svgInput:document.getElementById("svg-input"),svgFileName:document.getElementById("svg-file-name"),generateBtn:document.getElementById("generate-btn"),resetBtn:document.getElementById("reset-btn"),resetCameraBtn:document.getElementById("reset-camera-btn"),exportCodeBtn:document.getElementById("export-code-btn"),exportGifBtn:document.getElementById("export-gif-btn"),copyCodeBtn:document.getElementById("copy-code-btn"),codeModal:document.getElementById("code-modal"),closeModalBtn:document.querySelector(".close-modal"),codeEl:document.getElementById("generated-code"),notification:document.getElementById("notification"),loadingEl:document.getElementById("loading"),useGradientCheckbox:document.getElementById("use-gradient"),preserveColorsCheckbox:document.getElementById("preserve-colors"),useInstancedRenderingCheckbox:document.getElementById("use-instanced-rendering"),solidColorControl:document.getElementById("solid-color-control"),gradientControls:document.getElementById("gradient-controls"),dropArea:document.getElementById("drop-area"),sandEffectCheckbox:document.getElementById("sand-effect"),enableOrbitCheckbox:document.getElementById("enable-orbit"),addSvgBtn:document.getElementById("add-svg-btn"),layersList:document.getElementById("layers-list"),emptyLayersMessage:document.querySelector(".empty-layers-message"),layerTemplate:document.getElementById("layer-template"),fpsCounter:document.getElementById("fps-counter"),particleCounter:document.getElementById("particle-counter"),screenshotBtn:document.getElementById("screenshot-btn"),layerPositionX:document.getElementById("layer-position-x"),layerPositionY:document.getElementById("layer-position-y"),layerPositionZ:document.getElementById("layer-position-z"),layerRotationX:document.getElementById("layer-rotation-x"),layerRotationY:document.getElementById("layer-rotation-y"),layerRotationZ:document.getElementById("layer-rotation-z"),gradientRotation:document.getElementById("gradient-rotation"),enableRigidBody:document.getElementById("enable-rigid-body"),rigidBodySize:document.getElementById("rigid-body-size"),rigidBodyForce:document.getElementById("rigid-body-force"),rigidBodyReturn:document.getElementById("rigid-body-return"),rigidBodyX:document.getElementById("rigid-body-x"),rigidBodyY:document.getElementById("rigid-body-y"),rigidBodyZ:document.getElementById("rigid-body-z"),rigidBodyIndicator:document.getElementById("rigid-body-indicator")},i={particleGeometry:null,materialCache:new Map,disposables:[]};function o(){if(!e.rigidBody.active||!t.rigidBodyIndicator)return;e.rigidBody.mesh&&(e.rigidBody.mesh.position.copy(e.rigidBody.position),e.rigidBody.mesh.scale.set(e.rigidBody.size,e.rigidBody.size,e.rigidBody.size),e.rigidBody.mesh.visible=e.rigidBody.active);let i=e.rigidBody.position.clone();i.project(e.camera);let o=(.5*i.x+.5)*t.sceneContainer.clientWidth,n=(-.5*i.y+.5)*t.sceneContainer.clientHeight;t.rigidBodyIndicator.style.left=`${o-e.rigidBody.size}px`,t.rigidBodyIndicator.style.top=`${n-e.rigidBody.size}px`,t.rigidBodyIndicator.querySelector(".sphere").style.width=`${2*e.rigidBody.size}px`,t.rigidBodyIndicator.querySelector(".sphere").style.height=`${2*e.rigidBody.size}px`,t.rigidBodyIndicator.classList.toggle("active",e.rigidBody.active)}function n(){if(!e.bloomPass)return;let t=document.getElementById("glow-effect").checked,i=parseFloat(document.getElementById("bloom-strength").value)||.9,o=parseFloat(document.getElementById("bloom-radius").value)||.4,n=parseFloat(document.getElementById("bloom-threshold").value)||.85;e.bloomPass.enabled=t,e.bloomPass.strength=i,e.bloomPass.radius=o,e.bloomPass.threshold=n}function r(e){e.preventDefault(),e.stopPropagation()}function a(e){let i=e.dataTransfer,o=i.files;if(o.length){let n=o[0];"image/svg+xml"===n.type||n.name.toLowerCase().endsWith(".svg")?(t.svgFileName.textContent=n.name,b(n)):Y("Please upload an SVG file.","warning")}}function s(){e.rigidBody.active=t.enableRigidBody.checked,e.rigidBody.size=parseInt(t.rigidBodySize.value),e.rigidBody.force=parseFloat(t.rigidBodyForce.value),e.rigidBody.returnSpeed=parseFloat(t.rigidBodyReturn.value),e.rigidBody.position.set(parseInt(t.rigidBodyX.value),parseInt(t.rigidBodyY.value),parseInt(t.rigidBodyZ.value)),o()}function l(){let e=d();if(!e||!e.group)return;let i=parseFloat(t.layerPositionX.value),o=parseFloat(t.layerPositionY.value),n=parseFloat(t.layerPositionZ.value),r=parseFloat(t.layerRotationX.value)*(Math.PI/180),a=parseFloat(t.layerRotationY.value)*(Math.PI/180),s=parseFloat(t.layerRotationZ.value)*(Math.PI/180);e.group.position.set(i,o,n),e.group.rotation.set(r,a,s)}function d(){return e.activeLayerId?e.layers.find(t=>t.id===e.activeLayerId):null}function c(){let e=[t.layerPositionX,t.layerPositionY,t.layerPositionZ,t.layerRotationX,t.layerRotationY,t.layerRotationZ];e.forEach(e=>{e&&(e.disabled=!0)});let i=document.getElementById("layer-position-panel");i&&(i.style.opacity="0.5")}function p(){if(!e.controls)return;let t=document.getElementById("enable-orbit").checked,i=parseFloat(document.getElementById("orbit-sensitivity").value)||1,o=parseFloat(document.getElementById("zoom-speed").value)||1,n=parseFloat(document.getElementById("pan-speed").value)||1;e.controls.enabled=t,e.controls.rotateSpeed=i,e.controls.zoomSpeed=o,e.controls.panSpeed=n}function g(t){let i=document.getElementById("mouse-interaction");if(!i||!i.checked||e.controls&&e.controls.enabled&&t.buttons>0)return;parseInt(document.getElementById("interaction-sensitivity")?.value||5);let o=e.renderer.domElement.getBoundingClientRect(),n=(t.clientX-o.left)/o.width*2-1,r=-(2*((t.clientY-o.top)/o.height))+1,a=new THREE.Raycaster;a.setFromCamera(new THREE.Vector2(n,r),e.camera);let s=new THREE.Plane(new THREE.Vector3(0,0,1),0),l=new THREE.Vector3;a.ray.intersectPlane(s,l)&&(e.mousePosition.copy(l),e.mouseMoved=!0)}function m(t){let i=document.getElementById("mouse-interaction");if(i&&i.checked&&(t.preventDefault(),t.touches.length>0)){let o=t.touches[0],n=e.renderer.domElement.getBoundingClientRect(),r=(o.clientX-n.left)/n.width*2-1,a=-(2*((o.clientY-n.top)/n.height))+1,s=new THREE.Raycaster;s.setFromCamera(new THREE.Vector2(r,a),e.camera);let l=new THREE.Plane(new THREE.Vector3(0,0,1),0),d=new THREE.Vector3;s.ray.intersectPlane(l,d)&&(e.mousePosition.copy(d),e.mouseMoved=!0)}}function y(){e.mousePosition.set(0,0,0),e.mouseMoved=!1}function u(e,t,i=""){if(t<1){let o=t.toString().split(".")[1].length;return parseFloat(e).toFixed(o)+i}return parseInt(e)+i}function f(){return t.sceneContainer.clientWidth/t.sceneContainer.clientHeight}function h(){e.camera.aspect=f(),e.camera.updateProjectionMatrix();let i=t.sceneContainer.clientWidth,n=t.sceneContainer.clientHeight;e.renderer.setSize(i,n),e.composer&&e.composer.setSize(i,n),o()}function $(){e.camera.position.set(0,0,200),e.camera.lookAt(0,0,0),e.controls&&e.controls.reset()}let v=!1,E;function S(){v&&clearTimeout(E),v=!0,E=setTimeout(()=>{v=!1,x()},300)}function x(){0!==e.layers.length&&(B(!0),setTimeout(()=>{try{e.layers.forEach(e=>{C(e)}),R(),H()}catch(t){console.error("Error updating layers:",t),Y("Error updating particles. Please try again.","error")}finally{B(!1)}},100))}function B(e){t.loadingEl&&(e?t.loadingEl.classList.add("active"):t.loadingEl.classList.remove("active"))}function _(){if(0===e.layers.length){Y("Please upload an SVG file first.","warning");return}B(!0),setTimeout(()=>{try{e.layers.forEach(e=>{C(e)}),R(),H()}catch(t){console.error("Error generating particles:",t),Y("Error generating particles. Please try again.","error")}finally{B(!1)}},100)}function b(i){B(!0);let o=new FileReader;o.onload=function(o){let n=o.target.result,r=i.name;try{(function i(o,n){let r=`layer-${e.nextLayerId++}`,a={id:r,name:n||`Layer ${e.layers.length+1}`,svgString:o,visible:!0,group:new THREE.Group,particles:[],instanceData:[],originalPositions:[],particleCount:0,useInstanced:t.useInstancedRenderingCheckbox&&t.useInstancedRenderingCheckbox.checked};return e.scene.add(a.group),e.layers.push(a),function i(o){if(!t.layerTemplate||!t.layersList)return;let n=t.layerTemplate.content.cloneNode(!0),r=n.querySelector("li");r.dataset.layerId=o.id;let a=r.querySelector(".layer-name");a&&(a.textContent=o.name);let s=r.querySelector(".layer-visibility");s&&(o.visible||s.classList.add("hidden"),s.addEventListener("click",i=>{i.stopPropagation(),function i(o){let n=e.layers.find(e=>e.id===o);if(!n)return;n.visible=!n.visible,n.group&&(n.group.visible=n.visible);let r=t.layersList.querySelector(`[data-layer-id="${o}"]`);if(r){let a=r.querySelector(".layer-visibility");a&&(n.visible?a.classList.remove("hidden"):a.classList.add("hidden"))}R()}(o.id)}));let l=r.querySelector(".layer-delete");l&&l.addEventListener("click",e=>{e.stopPropagation(),I(o.id)});let d=r.querySelector(".layer-edit");d&&d.addEventListener("click",e=>{e.stopPropagation(),P(o.id)}),r.addEventListener("click",()=>{P(o.id)}),function i(o){o.setAttribute("draggable","true");let n=o.querySelector(".layer-drag-handle");n&&(n.addEventListener("mousedown",()=>{o.draggable=!0}),n.addEventListener("mouseup",()=>{o.draggable=!1})),o.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/plain",o.dataset.layerId),o.classList.add("dragging"),n&&n.classList.add("dragging")}),o.addEventListener("dragend",()=>{o.classList.remove("dragging"),n&&n.classList.remove("dragging"),document.querySelectorAll(".layer-drop-indicator").forEach(e=>e.remove())}),o.addEventListener("dragover",e=>{e.preventDefault(),document.querySelectorAll(".layer-drop-indicator").forEach(e=>e.remove());let t=e.dataTransfer.getData("text/plain");if(!t||t===o.dataset.layerId)return;let i=o.getBoundingClientRect(),n=e.clientY-i.top,r=n>i.height/2,a=document.createElement("div");a.classList.add("layer-drop-indicator"),r?o.after(a):o.before(a)}),o.addEventListener("dragleave",()=>{let e=o.nextElementSibling;e&&e.classList.contains("layer-drop-indicator")&&e.remove();let t=o.previousElementSibling;t&&t.classList.contains("layer-drop-indicator")&&t.remove()}),o.addEventListener("drop",i=>{i.preventDefault();let n=i.dataTransfer.getData("text/plain");if(!n||n===o.dataset.layerId)return;let r=o.getBoundingClientRect(),a=i.clientY-r.top,s=a>r.height/2,l=e.layers.findIndex(e=>e.id===n),d=e.layers.findIndex(e=>e.id===o.dataset.layerId);-1!==l&&-1!==d&&(s&&d++,function i(o,n){if(o===n)return;let r=e.layers.splice(o,1)[0];o<n&&n--,e.layers.splice(n,0,r),function i(){if(!t.layersList)return;let o=document.createDocumentFragment();for(let n=e.layers.length-1;n>=0;n--){let r=e.layers[n],a=t.layersList.querySelector(`[data-layer-id="${r.id}"]`);a&&o.appendChild(a)}t.layersList.innerHTML="",t.layersList.appendChild(o)}(),e.layers.forEach(t=>{t.group&&e.scene.remove(t.group)}),e.layers.forEach(t=>{t.group&&e.scene.add(t.group)})}(l,d),document.querySelectorAll(".layer-drop-indicator").forEach(e=>e.remove()))})}(r),t.layersList.appendChild(r)}(a),k(),P(r),function e(t){try{w(t),D(t,t.svgString),R()}catch(i){console.error("Error processing layer SVG:",i),Y(`Error processing layer "${t.name}"`,"error")}}(a),a})(n,r),t.dropArea&&t.dropArea.classList.add("hidden")}catch(a){console.error("Error processing SVG:",a),Y("Error processing SVG. File may be incompatible.","error")}finally{B(!1)}},o.onerror=function(){Y("Error reading file","error"),B(!1)},o.readAsText(i)}function w(e){if(e.group)for(;e.group.children.length>0;){let t=e.group.children[0];e.group.remove(t),t.geometry&&t.geometry.dispose(),t.material&&(Array.isArray(t.material)?t.material.forEach(e=>e.dispose()):t.material.dispose())}e.particles=[],e.instanceData=[],e.originalPositions=[],e.particleCount=0}function C(e){e&&e.svgString&&(w(e),e.useInstanced=t.useInstancedRenderingCheckbox&&t.useInstancedRenderingCheckbox.checked,D(e,e.svgString))}function I(i){var o;let n=e.layers.findIndex(e=>e.id===i);if(-1===n)return;let r=e.layers[n];r.group&&(w(r),e.scene.remove(r.group),(o=r).useInstanced&&o.particles?(o.particles.geometry&&o.particles.geometry.dispose(),o.particles.material&&(Array.isArray(o.particles.material)?o.particles.material.forEach(e=>e.dispose()):o.particles.material.dispose())):Array.isArray(o.particles)&&o.particles.forEach(e=>{e.geometry&&e.geometry.dispose(),e.material&&e.material.dispose()})),e.layers.splice(n,1);let a=t.layersList.querySelector(`[data-layer-id="${i}"]`);a&&a.remove(),e.activeLayerId===i&&(e.layers.length>0?P(e.layers[0].id):(e.activeLayerId=null,c())),k(),0===e.layers.length&&t.dropArea&&t.dropArea.classList.remove("hidden"),R()}function P(i){e.activeLayerId=i,document.querySelectorAll(".layer-item").forEach(e=>{e.classList.remove("active")});let o=document.querySelector(`.layer-item[data-layer-id="${i}"]`);o&&o.classList.add("active"),function e(){let i=d();if(!i||!i.group){c();return}(function e(){let i=[t.layerPositionX,t.layerPositionY,t.layerPositionZ,t.layerRotationX,t.layerRotationY,t.layerRotationZ];i.forEach(e=>{e&&(e.disabled=!1)});let o=document.getElementById("layer-position-panel");o&&(o.style.opacity="1")})(),t.layerPositionX.value=i.group.position.x,t.layerPositionY.value=i.group.position.y,t.layerPositionZ.value=i.group.position.z,t.layerRotationX.value=i.group.rotation.x*(180/Math.PI),t.layerRotationY.value=i.group.rotation.y*(180/Math.PI),t.layerRotationZ.value=i.group.rotation.z*(180/Math.PI),document.getElementById("layer-position-x-value").textContent=Math.round(i.group.position.x),document.getElementById("layer-position-y-value").textContent=Math.round(i.group.position.y),document.getElementById("layer-position-z-value").textContent=Math.round(i.group.position.z),document.getElementById("layer-rotation-x-value").textContent=Math.round(i.group.rotation.x*(180/Math.PI)),document.getElementById("layer-rotation-y-value").textContent=Math.round(i.group.rotation.y*(180/Math.PI)),document.getElementById("layer-rotation-z-value").textContent=Math.round(i.group.rotation.z*(180/Math.PI))}()}function k(){t.emptyLayersMessage&&(0===e.layers.length?t.emptyLayersMessage.style.display="block":t.emptyLayersMessage.style.display="none")}function R(){if(!t.particleCounter)return;let i=0;e.layers.forEach(e=>{e.visible&&(i+=e.particleCount)}),e.particleCount=i,t.particleCounter.textContent=i.toLocaleString()}function z(e,t="fill"){let o=`${e}_${t}`;if(i.materialCache.has(o))return i.materialCache.get(o);let n=new THREE.Color(e);"stroke"===t&&n.multiplyScalar(1.2);let r=new THREE.MeshBasicMaterial({color:n,transparent:!0,opacity:"fill"===t?.8:.9});return i.materialCache.set(o,r),i.disposables.push(r),r}function D(o,n){try{let r=new DOMParser;r.parseFromString(n,"image/svg+xml");let a=document.createElement("canvas"),s=a.getContext("2d");a.width=2e3,a.height=2e3;let d=new Image,c=new Blob([n],{type:"image/svg+xml"}),p=URL.createObjectURL(c);d.onload=function(){let t=d.width/d.height,n,r,c,g;t>1?(r=(n=.8*a.width)/t,c=.1*a.width,g=(a.height-r)/2):(n=(r=.8*a.height)*t,c=(a.width-n)/2,g=.1*a.height),s.clearRect(0,0,a.width,a.height),s.drawImage(d,c,g,n,r);let m=s.getImageData(0,0,a.width,a.height),y=m.data,u=T(),f=[],h=[],$=u.includeStrokes;u.strokeWidth;let v=u.strokeDetail,E=u.particleDensity,S=2*E,x=[],B=[],_=[],b=[];for(let w=0;w<a.height;w+=S)for(let C=0;C<a.width;C+=S){let I=(w*a.width+C)*4;if(y[I+3]>50){let P=u.svgDepth,k=Math.random(),R=P>0?(k-.5)*2*P:0,D=new THREE.Vector3((C-a.width/2)*.1,-(.1*(w-a.height/2)),R),L;u.preserveColors&&(L=`rgb(${y[I]}, ${y[I+1]}, ${y[I+2]})`),f.push(D),h.push(L),_.push(D),b.push(L)}}if($)try{let V=document.createElement("canvas"),G=V.getContext("2d");V.width=a.width,V.height=a.height,G.drawImage(d,c,g,n,r);let H=G.getImageData(0,0,a.width,a.height),A=H.data,X=Math.max(1,S/v);for(let j=X;j<a.height-X;j+=X)for(let q=X;q<a.width-X;q+=X){let U=(j*a.width+q)*4;if(A[U+3]<50)continue;let W=M(A,q,j,a.width);if(W){let Z=u.svgDepth,N=Math.random(),K=Z>0?(N-.5)*2*Z:0,Q=new THREE.Vector3((q-a.width/2)*.1,-(.1*(j-a.height/2)),K),J;u.preserveColors&&(J=`rgb(${A[U]}, ${A[U+1]}, ${A[U+2]})`),f.push(Q),h.push(J),x.push(Q),B.push(J)}}}catch(ee){console.warn("Error in stroke detection:",ee)}(function t(o,n,r,a,s,d,c,p){try{let g=o.useInstanced&&n.length>500,m=function e(t,i,o,n,r,a,s){let l=[];if(t.length<=n)t.forEach((e,t)=>{l.push({point:e,isStroke:i.includes(e),color:r?r[t]:null})});else{let d=i.length/t.length,c=Math.floor(n*d),p=n-c;if(i.length>0){let g=new Set;for(;g.size<Math.min(c,i.length);)g.add(Math.floor(Math.random()*i.length));for(let m of g)l.push({point:i[m],isStroke:!0,color:a?a[m]:null})}if(o.length>0){let y=new Set;for(;y.size<Math.min(p,o.length);)y.add(Math.floor(Math.random()*o.length));for(let u of y)l.push({point:o[u],isStroke:!1,color:s?s[u]:null})}if(0===l.length){let f=new Set;for(;f.size<n;)f.add(Math.floor(Math.random()*t.length));for(let h of f)l.push({point:t[h],isStroke:!1,color:r?r[h]:null})}}return l}(n,r,a,s.particleCount,d,c,p);g?function e(t,o,n){let r=new Map,a=n.preserveColors,s=n.useGradient&&!a,l=n.color,d=O(n.color,1.2),c=n.gradientColor1,p=n.gradientColor2,g=n.gradientRotation||0,m=i.particleGeometry,y=new Map;o.forEach(e=>{let t=e.point||e,i=e.isStroke||!1,o=e.color,n;if(a&&o)n=o;else if(s){let r=g*(Math.PI/180),m=(t.x+100)/200,u=(t.y+100)/200;n=F(c,p,Math.max(0,Math.min(1,m*Math.cos(r)-u*Math.sin(r))))}else n=i?d:l;let f=`${n}_${i?"stroke":"fill"}`,h=y.get(f)||0;y.set(f,h+1)}),y.forEach((e,i)=>{let[o,n]=i.split("_"),a=z(o,n),s=new THREE.InstancedMesh(m,a,e);s.frustumCulled=!1,r.set(i,{mesh:s,nextIndex:0}),t.group.add(s)}),t.particles=[],t.instanceData=[],t.originalPositions=[],o.forEach(e=>{let i=e.point||e,o=e.isStroke||!1,m=e.color,y=(n.minSize+Math.random()*(n.maxSize-n.minSize))*(o?.8:1),u;if(a&&m)u=m;else if(s){let f=g*(Math.PI/180),h=(i.x+100)/200,$=(i.y+100)/200;u=F(c,p,Math.max(0,Math.min(1,h*Math.cos(f)-$*Math.sin(f))))}else u=o?d:l;let v=`${u}_${o?"stroke":"fill"}`,E=r.get(v);if(E){let{mesh:S,nextIndex:x}=E,B=new THREE.Matrix4;B.makeTranslation(i.x,i.y,i.z),B.scale(new THREE.Vector3(y,y,y)),S.setMatrixAt(x,B),t.particles.push(S);let _={originalPosition:i.clone(),size:y,isStroke:o,mesh:S,index:x,depthFactor:0!==i.z?(i.z/n.svgDepth+.5)/2:Math.random(),angle:Math.random()*Math.PI*2,speed:.05+.05*Math.random(),amplitude:2*Math.random(),offset:new THREE.Vector3,velocity:new THREE.Vector3(0,0,0),noiseOffset:{x:1e3*Math.random(),y:1e3*Math.random(),z:1e3*Math.random()}};t.instanceData.push(_),t.originalPositions.push(i.clone()),E.nextIndex+=1}}),r.forEach(e=>{e.mesh.instanceMatrix.needsUpdate=!0})}(o,m,s):function e(t,o,n){try{let r=n.preserveColors,a=n.useGradient&&!r,s=n.color,l=O(n.color,1.2),d=n.gradientColor1,c=n.gradientColor2,p=n.gradientRotation||0;t.particles=[],t.originalPositions=[],o.forEach(e=>{let o=e.point||e,g=e.isStroke||!1,m=e.color,y=(n.minSize+Math.random()*(n.maxSize-n.minSize))*(g?.8:1),u;if(r&&m)u=z(m,g?"stroke":"fill");else if(a){let f=p*(Math.PI/180),h=(o.x+100)/200,$=(o.y+100)/200,v=F(d,c,Math.max(0,Math.min(1,h*Math.cos(f)-$*Math.sin(f))));u=z(v,g?"stroke":"fill")}else u=z(g?l:s,g?"stroke":"fill");let E=new THREE.Mesh(i.particleGeometry,u);E.position.copy(o),E.scale.set(y,y,y),E.userData.originalPosition=o.clone(),t.originalPositions.push(o.clone()),E.userData.size=y,E.userData.isStroke=g,E.userData.depthFactor=0!==o.z?(o.z/n.svgDepth+.5)/2:Math.random(),E.userData.velocity=new THREE.Vector3(0,0,0),E.userData.angle=Math.random()*Math.PI*2,E.userData.speed=.05+.05*Math.random(),E.userData.amplitude=2*Math.random(),E.userData.offset=new THREE.Vector3,E.userData.noiseOffset={x:1e3*Math.random(),y:1e3*Math.random(),z:1e3*Math.random()},t.group.add(E),t.particles.push(E)})}catch(g){console.error("Error in createTraditionalParticles:",g)}}(o,m,s),o.group.scale.set(s.svgScale,s.svgScale,s.svgScale),e.activeLayerId===o.id&&l(),o.particleCount=m.length}catch(y){console.error("Error in createParticles:",y),Y("Error creating particles.","error")}})(o,f,x,_,u,h,B,b),URL.revokeObjectURL(p)},d.onerror=function(){console.error("Error loading SVG"),B(!1),Y("Error loading SVG. File may be corrupted.","error"),t.dropArea&&t.dropArea.classList.remove("hidden")},d.src=p}catch(g){console.error("Error creating particles from SVG:",g),B(!1),Y("Error processing SVG.","error")}}function M(e,t,i,o){if(e[(i*o+t)*4+3]<50)return!1;for(let[n,r]of[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]]){let a=t+n,s=i+r,l=(s*o+a)*4;if(e[l+3]<50)return!0}return!1}function L(i){requestAnimationFrame(L);try{e.controls&&e.controls.update();let n=i-e.lastFrameTime;e.lastFrameTime=i,function i(o){if(t.fpsCounter&&(e.frameCounter++,e.fpsUpdateTime+=o,e.fpsUpdateTime>=500)){let n=Math.round(e.frameCounter/(e.fpsUpdateTime/1e3));t.fpsCounter.textContent=n,e.frameCounter=0,e.fpsUpdateTime=0,n>=55?t.fpsCounter.style.color="#10b981":n>=30?t.fpsCounter.style.color="#f59e0b":t.fpsCounter.style.color="#ef4444"}}(n),function t(i){if(0!==e.layers.length)try{let n=T(),r=.001*performance.now()*n.animationSpeed*.5,a=n.sandEffect,s=n.sandStrength,l=n.sandReturn,d=n.mouseInteraction&&e.mouseMoved,c=n.repelEffect,p=n.interactionRadius,g=n.interactionStrength,m=e.rigidBody.active,y=e.rigidBody.position,u=e.rigidBody.size,f=e.rigidBody.force,h=e.rigidBody.returnSpeed;m&&o(),e.layers.forEach(t=>{var i,o,$,v,E,S,x,B,_,b,w,C,I,P,k;t.visible&&(t.useInstanced?function t(i,o,n,r,a,s,l,d,c,p,g,m,y,u,f){if(!i.instanceData||0===i.instanceData.length)return;let h=new Map;i.instanceData.forEach((t,$)=>{let{mesh:v,originalPosition:E,size:S,isStroke:x,depthFactor:B,angle:_,speed:b,amplitude:w,noiseOffset:C,index:I}=t;if(!v||!v.visible)return;let P=new THREE.Matrix4;v.getMatrixAt(I,P);let k=new THREE.Vector3,R=new THREE.Vector3,z=new THREE.Quaternion;P.decompose(k,z,R);let D=E.clone();if(n.noiseMovement){t.noiseOffset.x+=.002*n.animationSpeed,t.noiseOffset.y+=.002*n.animationSpeed,t.noiseOffset.z+=.002*n.animationSpeed;let M=e.simplex.noise3D(t.noiseOffset.x,t.noiseOffset.y,0)*n.noiseScale*100,L=e.simplex.noise3D(t.noiseOffset.y,t.noiseOffset.z,0)*n.noiseScale*100,T=e.simplex.noise3D(t.noiseOffset.z,t.noiseOffset.x,0)*n.noiseScale*50;t.offset.x=M,t.offset.y=L,t.offset.z=T*(n.svgDepth>0?1:0),D.add(t.offset)}else t.angle+=t.speed*n.animationSpeed,t.offset.x=Math.sin(t.angle+o)*t.amplitude,t.offset.y=Math.cos(t.angle+1.5*o)*t.amplitude,n.svgDepth>0&&(t.offset.z=Math.sin(t.angle+.7*o)*t.amplitude*.5),D.add(t.offset);x&&t.offset.multiplyScalar(1.2);let V=new THREE.Vector3;if(r&&e.mousePosition.length()>0){let G=k.distanceTo(e.mousePosition);if(G<s*i.group.scale.x){let H=(s*i.group.scale.x-G)/(s*i.group.scale.x),F=new THREE.Vector3().subVectors(k,e.mousePosition).normalize();V=F.multiplyScalar(l*H),a?D.add(V):D.sub(V),d&&(a?t.velocity.add(V.multiplyScalar(.1*c)):t.velocity.sub(V.multiplyScalar(.1*c)))}}if(g){let O=m.clone(),A=k.distanceTo(O);if(A<y){let X=new THREE.Vector3().subVectors(k,O).normalize(),Y=X.multiplyScalar(u*((y-A)/y));D.add(Y),t.velocity.add(Y.multiplyScalar(.1))}}if(d||g){let j=i.originalPositions[$]?i.originalPositions[$].clone().add(t.offset):D.clone(),q=j.clone().sub(k),U=q.multiplyScalar(.05*(g?f:p));t.velocity.add(U),t.velocity.multiplyScalar(.95),D.copy(k.clone().add(t.velocity))}let W=new THREE.Matrix4;W.makeTranslation(D.x,D.y,D.z);let Z=new THREE.Matrix4().makeRotationX(.01*n.animationSpeed),N=new THREE.Matrix4().makeRotationY(.01*n.animationSpeed);W.multiply(Z).multiply(N),W.scale(new THREE.Vector3(S,S,S)),h.has(v)||h.set(v,[]),h.get(v).push({index:I,matrix:W})}),h.forEach((e,t)=>{e.forEach(e=>{t.setMatrixAt(e.index,e.matrix)}),t.instanceMatrix.needsUpdate=!0})}(t,r,n,d,c,p,g,a,s,l,m,y,u,f,h):(i=t,o=r,$=n,v=d,E=c,S=p,x=g,B=a,_=s,b=l,w=m,C=y,I=u,P=f,k=h,i.particles&&0!==i.particles.length&&i.particles.forEach((t,n)=>{if(!t.visible)return;let r=t.position.clone(),a=t.userData.originalPosition?t.userData.originalPosition.clone():new THREE.Vector3;if($.noiseMovement){t.userData.noiseOffset.x+=.002*$.animationSpeed,t.userData.noiseOffset.y+=.002*$.animationSpeed,t.userData.noiseOffset.z+=.002*$.animationSpeed;let s=e.simplex.noise3D(t.userData.noiseOffset.x,t.userData.noiseOffset.y,0)*$.noiseScale*100,l=e.simplex.noise3D(t.userData.noiseOffset.y,t.userData.noiseOffset.z,0)*$.noiseScale*100,d=e.simplex.noise3D(t.userData.noiseOffset.z,t.userData.noiseOffset.x,0)*$.noiseScale*50;t.userData.offset.x=s,t.userData.offset.y=l,t.userData.offset.z=d*($.svgDepth>0?1:0),a.add(t.userData.offset)}else t.userData.angle+=t.userData.speed*$.animationSpeed,t.userData.offset.x=Math.sin(t.userData.angle+o)*t.userData.amplitude,t.userData.offset.y=Math.cos(t.userData.angle+1.5*o)*t.userData.amplitude,$.svgDepth>0&&(t.userData.offset.z=Math.sin(t.userData.angle+.7*o)*t.userData.amplitude*.5),a.add(t.userData.offset);t.userData.isStroke&&t.userData.offset.multiplyScalar(1.2);let c=new THREE.Vector3;if(v&&e.mousePosition.length()>0){let p=t.position.distanceTo(e.mousePosition);if(p<S*i.group.scale.x){let g=(S*i.group.scale.x-p)/(S*i.group.scale.x),m=new THREE.Vector3().subVectors(t.position,e.mousePosition).normalize();c=m.multiplyScalar(x*g),E?a.add(c):a.sub(c),B&&(E?t.userData.velocity.add(c.multiplyScalar(.1*_)):t.userData.velocity.sub(c.multiplyScalar(.1*_)))}}if(w){let y=C.clone(),u=t.position.distanceTo(y);if(u<I){let f=new THREE.Vector3().subVectors(t.position,y).normalize(),h=f.multiplyScalar(P*((I-u)/I));a.add(h),t.userData.velocity.add(h.multiplyScalar(.1))}}if(B||w){let R=i.originalPositions[n]?i.originalPositions[n].clone().add(t.userData.offset):a.clone(),z=R.clone().sub(r),D=z.multiplyScalar(.05*(w?k:b));t.userData.velocity.add(D),t.userData.velocity.multiplyScalar(.95),a=r.clone().add(t.userData.velocity)}t.position.copy(a),t.rotation.x+=.01*$.animationSpeed,t.rotation.y+=.01*$.animationSpeed})))})}catch($){console.error("Error in updateParticlesAnimation:",$)}}(n);let r=document.getElementById("glow-effect");r&&r.checked&&e.composer?e.composer.render():e.renderer.render(e.scene,e.camera)}catch(a){console.error("Error in animate loop:",a)}}function T(){try{return{particleCount:parseInt(document.getElementById("particle-count")?.value||1500),particleDensity:parseInt(document.getElementById("particle-density")?.value||4),minSize:parseFloat(document.getElementById("min-size")?.value||.5),maxSize:parseFloat(document.getElementById("max-size")?.value||1.5),color:document.getElementById("particle-color")?.value||"#5756d5",useGradient:document.getElementById("use-gradient")?.checked||!0,gradientColor1:document.getElementById("gradient-color1")?.value||"#5756d5",gradientColor2:document.getElementById("gradient-color2")?.value||"#d956aa",gradientRotation:parseInt(document.getElementById("gradient-rotation")?.value||0),preserveColors:document.getElementById("preserve-colors")?.checked||!1,animationSpeed:parseFloat(document.getElementById("animation-speed")?.value||1),mouseInteraction:document.getElementById("mouse-interaction")?.checked||!0,sandEffect:document.getElementById("sand-effect")?.checked||!1,sandStrength:parseFloat(document.getElementById("sand-strength")?.value||5),sandReturn:parseFloat(document.getElementById("sand-return")?.value||1),repelEffect:document.getElementById("repel-effect")?.checked||!1,interactionRadius:parseInt(document.getElementById("interaction-radius")?.value||80),interactionStrength:parseFloat(document.getElementById("interaction-strength")?.value||3),interactionSensitivity:parseInt(document.getElementById("interaction-sensitivity")?.value||5),glowEffect:document.getElementById("glow-effect")?.checked||!0,bloomStrength:parseFloat(document.getElementById("bloom-strength")?.value||.9),bloomRadius:parseFloat(document.getElementById("bloom-radius")?.value||.4),bloomThreshold:parseFloat(document.getElementById("bloom-threshold")?.value||.85),noiseMovement:document.getElementById("noise-movement")?.checked||!0,noiseScale:parseFloat(document.getElementById("noise-scale")?.value||.02),includeStrokes:document.getElementById("include-strokes")?.checked||!0,strokeWidth:parseInt(document.getElementById("stroke-width")?.value||2),strokeDetail:parseInt(document.getElementById("stroke-detail")?.value||5),enableOrbit:document.getElementById("enable-orbit")?.checked||!0,orbitSensitivity:parseFloat(document.getElementById("orbit-sensitivity")?.value||1),zoomSpeed:parseFloat(document.getElementById("zoom-speed")?.value||1),panSpeed:parseFloat(document.getElementById("pan-speed")?.value||1),svgScale:parseFloat(document.getElementById("svg-scale")?.value||1),svgDepth:parseInt(document.getElementById("svg-depth")?.value||20),useInstanced:document.getElementById("use-instanced-rendering")?.checked||!0,enableRigidBody:document.getElementById("enable-rigid-body")?.checked||!1,rigidBodySize:parseInt(document.getElementById("rigid-body-size")?.value||30),rigidBodyForce:parseFloat(document.getElementById("rigid-body-force")?.value||10),rigidBodyReturn:parseFloat(document.getElementById("rigid-body-return")?.value||1),rigidBodyX:parseInt(document.getElementById("rigid-body-x")?.value||0),rigidBodyY:parseInt(document.getElementById("rigid-body-y")?.value||0),rigidBodyZ:parseInt(document.getElementById("rigid-body-z")?.value||0)}}catch(e){return console.error("Error getting settings:",e),{particleCount:1500,particleDensity:4,minSize:.5,maxSize:1.5,color:"#5756d5",useGradient:!0,gradientColor1:"#5756d5",gradientColor2:"#d956aa",gradientRotation:0,preserveColors:!1,animationSpeed:1,mouseInteraction:!0,sandEffect:!1,sandStrength:5,sandReturn:1,repelEffect:!1,interactionRadius:80,interactionStrength:3,interactionSensitivity:5,glowEffect:!0,bloomStrength:.9,bloomRadius:.4,bloomThreshold:.85,noiseMovement:!0,noiseScale:.02,includeStrokes:!0,strokeWidth:2,strokeDetail:5,enableOrbit:!0,orbitSensitivity:1,zoomSpeed:1,panSpeed:1,svgScale:1,svgDepth:20,useInstanced:!0,enableRigidBody:!1,rigidBodySize:30,rigidBodyForce:10,rigidBodyReturn:1,rigidBodyX:0,rigidBodyY:0,rigidBodyZ:0}}}function V(){try{for(!function e(i){try{let o={"particle-count":{value:i.particleCount,display:i.particleCount.toString()},"particle-density":{value:i.particleDensity,display:i.particleDensity.toString()},"min-size":{value:i.minSize,display:i.minSize.toFixed(1)},"max-size":{value:i.maxSize,display:i.maxSize.toFixed(1)},"particle-color":{value:i.color},"use-gradient":{checked:i.useGradient},"preserve-colors":{checked:i.preserveColors},"gradient-color1":{value:i.gradientColor1},"gradient-color2":{value:i.gradientColor2},"gradient-rotation":{value:i.gradientRotation,display:i.gradientRotation.toString()+"\xb0"},"animation-speed":{value:i.animationSpeed,display:i.animationSpeed.toFixed(1)},"mouse-interaction":{checked:i.mouseInteraction},"repel-effect":{checked:i.repelEffect},"sand-effect":{checked:i.sandEffect},"sand-strength":{value:i.sandStrength,display:i.sandStrength.toFixed(1)},"sand-return":{value:i.sandReturn,display:i.sandReturn.toFixed(1)},"interaction-radius":{value:i.interactionRadius,display:i.interactionRadius.toString()},"interaction-strength":{value:i.interactionStrength,display:i.interactionStrength.toFixed(1)},"interaction-sensitivity":{value:i.interactionSensitivity,display:i.interactionSensitivity.toString()},"glow-effect":{checked:i.glowEffect},"bloom-strength":{value:i.bloomStrength,display:i.bloomStrength.toFixed(1)},"bloom-radius":{value:i.bloomRadius,display:i.bloomRadius.toFixed(2)},"bloom-threshold":{value:i.bloomThreshold,display:i.bloomThreshold.toFixed(2)},"noise-movement":{checked:i.noiseMovement},"noise-scale":{value:i.noiseScale,display:i.noiseScale.toFixed(3)},"include-strokes":{checked:i.includeStrokes},"stroke-width":{value:i.strokeWidth,display:i.strokeWidth.toString()},"stroke-detail":{value:i.strokeDetail,display:i.strokeDetail.toString()},"enable-orbit":{checked:i.enableOrbit},"orbit-sensitivity":{value:i.orbitSensitivity,display:i.orbitSensitivity.toFixed(1)},"zoom-speed":{value:i.zoomSpeed,display:i.zoomSpeed.toFixed(1)},"pan-speed":{value:i.panSpeed,display:i.panSpeed.toFixed(1)},"svg-scale":{value:i.svgScale,display:i.svgScale.toFixed(1)},"svg-depth":{value:i.svgDepth,display:i.svgDepth.toString()},"use-instanced-rendering":{checked:i.useInstanced},"enable-rigid-body":{checked:i.enableRigidBody},"rigid-body-size":{value:i.rigidBodySize,display:i.rigidBodySize.toString()},"rigid-body-force":{value:i.rigidBodyForce,display:i.rigidBodyForce.toFixed(1)},"rigid-body-return":{value:i.rigidBodyReturn,display:i.rigidBodyReturn.toFixed(1)},"rigid-body-x":{value:i.rigidBodyX,display:i.rigidBodyX.toString()},"rigid-body-y":{value:i.rigidBodyY,display:i.rigidBodyY.toString()},"rigid-body-z":{value:i.rigidBodyZ,display:i.rigidBodyZ.toString()}};for(let[r,a]of Object.entries(o)){let l=document.getElementById(r);if(l&&(("checked"in a)&&(l.checked=a.checked),("value"in a)&&(l.value=a.value),("display"in a))){let d=document.getElementById(`${r}-value`);d&&(d.textContent=a.display)}}t.solidColorControl&&t.gradientControls&&(t.solidColorControl.style.display=i.useGradient?"none":"block",t.gradientControls.style.display=i.useGradient?"block":"none"),n(),p(),s(),x()}catch(c){console.error("Error applying settings:",c),Y("Error applying settings","error")}}({particleCount:1500,particleDensity:4,minSize:.5,maxSize:1.5,color:"#5756d5",useGradient:!0,gradientColor1:"#5756d5",gradientColor2:"#d956aa",gradientRotation:0,preserveColors:!1,animationSpeed:1,mouseInteraction:!0,sandEffect:!1,sandStrength:5,sandReturn:1,repelEffect:!1,interactionRadius:80,interactionStrength:3,interactionSensitivity:5,glowEffect:!0,bloomStrength:.9,bloomRadius:.4,bloomThreshold:.85,noiseMovement:!0,noiseScale:.02,includeStrokes:!0,strokeWidth:2,strokeDetail:5,enableOrbit:!0,orbitSensitivity:1,zoomSpeed:1,panSpeed:1,svgScale:1,svgDepth:20,useInstanced:!0,enableRigidBody:!1,rigidBodySize:30,rigidBodyForce:10,rigidBodyReturn:1,rigidBodyX:0,rigidBodyY:0,rigidBodyZ:0}),$();e.layers.length>0;)I(e.layers[0].id);t.dropArea&&t.dropArea.classList.remove("hidden"),Y("Settings reset to defaults","success")}catch(i){console.error("Error in resetSettings:",i),Y("Error resetting settings","error")}}function G(){try{let e=t.codeEl.textContent;navigator.clipboard.writeText(e).then(()=>{Y("Code copied to clipboard!","success")})}catch(i){console.error("Error copying code:",i),Y("Error copying code. Please try again.","error")}}function H(){try{let i=T(),o=new Date().toLocaleString(),n=`/**
 * SVG Partycle Generator (Version 2.0)
 * Created by Enrico Deiana - https://www.enricodeiana.design/
 * Generated on ${o}
 *
 * Enhanced with:
 * - Multi-layer SVG support with position control
 * - Gradient rotation
 * - Rigid body physics
 * - High performance instanced rendering
 */

// Required imports:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.min.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/simplex-noise@2.4.0/simplex-noise.min.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js"></script>

// Initialize the application
const ParticleSystem = (function() {
  // Private variables
  let camera, scene, renderer, controls;
  let composer, bloomPass;
  let simplex = new SimplexNoise();
  let layers = [];
  let mousePosition = new THREE.Vector3();
  let mouseMoved = false;
  let rigidBody = {
    active: ${i.enableRigidBody},
    position: new THREE.Vector3(${i.rigidBodyX}, ${i.rigidBodyY}, ${i.rigidBodyZ}),
    size: ${i.rigidBodySize},
    force: ${i.rigidBodyForce},
    returnSpeed: ${i.rigidBodyReturn},
    mesh: null
  };
  
  // Initialize the application
  function init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container element not found');
      return false;
    }
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0a18');
    
    // Create camera
    camera = new THREE.PerspectiveCamera(
      60, container.clientWidth / container.clientHeight, 0.1, 1000
    );
    camera.position.z = 200;
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    
    // Setup post-processing for bloom effect
    setupPostProcessing();
    
    // Add OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enabled = ${i.enableOrbit};
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = ${i.orbitSensitivity};
    controls.zoomSpeed = ${i.zoomSpeed};
    controls.panSpeed = ${i.panSpeed};
    controls.screenSpacePanning = true;
    controls.minDistance = 50;
    controls.maxDistance = 500;
    
    // Setup mouse interaction
    setupMouseInteraction();
    
    // Initialize rigid body if enabled
    if (rigidBody.active) {
      initRigidBody();
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
      composer.setSize(width, height);
    });
    
    // Start animation loop
    animate();
    
    return true;
  }
  
  // Initialize rigid body
  function initRigidBody() {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x5756d5),
      transparent: true,
      opacity: 0.2,
      wireframe: true
    });
    
    rigidBody.mesh = new THREE.Mesh(geometry, material);
    rigidBody.mesh.position.copy(rigidBody.position);
    rigidBody.mesh.scale.set(rigidBody.size, rigidBody.size, rigidBody.size);
    scene.add(rigidBody.mesh);
  }
  
  // Setup post-processing
  function setupPostProcessing() {
    composer = new THREE.EffectComposer(renderer);
    
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(renderer.domElement.width, renderer.domElement.height),
      ${i.bloomStrength}, // Strength
      ${i.bloomRadius}, // Radius
      ${i.bloomThreshold} // Threshold
    );
    bloomPass.enabled = ${i.glowEffect};
    composer.addPass(bloomPass);
  }
  
  // Setup mouse interaction
  function setupMouseInteraction() {
    renderer.domElement.addEventListener('mousemove', (event) => {
      if (!${i.mouseInteraction}) return;
      
      // Don't update if orbit controls are being used with mouse button down
      if (controls.enabled && event.buttons > 0) return;
      
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const intersection = new THREE.Vector3();
      
      if (raycaster.ray.intersectPlane(plane, intersection)) {
        mousePosition.copy(intersection);
        mouseMoved = true;
      }
    });
    
    renderer.domElement.addEventListener('mouseleave', () => {
      mousePosition.set(0, 0, 0);
      mouseMoved = false;
    });
    
    // Touch support
    renderer.domElement.addEventListener('touchmove', (event) => {
      if (!${i.mouseInteraction}) return;
      
      event.preventDefault();
      
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
        
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const intersection = new THREE.Vector3();
        
        if (raycaster.ray.intersectPlane(plane, intersection)) {
          mousePosition.copy(intersection);
          mouseMoved = true;
        }
      }
    }, { passive: false });
  }

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    if (controls) controls.update();
    
    // Update particles animation
    updateParticlesAnimation();
    
    // Render with post-processing if enabled
    if (${i.glowEffect} && composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }
  
  // SVG layer management
  let nextLayerId = 1;
  
  // Create a new layer from SVG
  function addSVGLayer(svgString, name, position = { x: 0, y: 0, z: 0 }, rotation = { x: 0, y: 0, z: 0 }) {
    const layerId = nextLayerId++;
    const layerName = name || \`Layer \${layerId}\`;
    
    // Create layer object
    const layer = {
      id: layerId,
      name: layerName,
      visible: true,
      group: new THREE.Group(),
      useInstanced: ${i.useInstanced}
    };
    
    // Set position and rotation
    layer.group.position.set(position.x, position.y, position.z);
    layer.group.rotation.set(rotation.x, rotation.y, rotation.z);
    
    // Add to scene
    scene.add(layer.group);
    
    // Add to layers array
    layers.push(layer);
    
    // Process SVG
    processSVG(layer, svgString);
    
    return layerId;
  }
  
  // Process SVG for a layer
  function processSVG(layer, svgString) {
    const settings = {
      particleCount: ${i.particleCount},
      particleDensity: ${i.particleDensity},
      minSize: ${i.minSize},
      maxSize: ${i.maxSize},
      color: '${i.color}',
      useGradient: ${i.useGradient},
      gradientColor1: '${i.gradientColor1}',
      gradientColor2: '${i.gradientColor2}',
      gradientRotation: ${i.gradientRotation},
      preserveColors: ${i.preserveColors},
      animationSpeed: ${i.animationSpeed},
      mouseInteraction: ${i.mouseInteraction},
      sandEffect: ${i.sandEffect},
      sandStrength: ${i.sandStrength},
      sandReturn: ${i.sandReturn},
      repelEffect: ${i.repelEffect},
      interactionRadius: ${i.interactionRadius},
      interactionStrength: ${i.interactionStrength},
      noiseMovement: ${i.noiseMovement},
      noiseScale: ${i.noiseScale},
      includeStrokes: ${i.includeStrokes},
      strokeWidth: ${i.strokeWidth},
      strokeDetail: ${i.strokeDetail},
      svgScale: ${i.svgScale},
      svgDepth: ${i.svgDepth}
    };
    
    // Create a DOMParser to parse the SVG
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
    
    // Create canvas to draw SVG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 2000;
    canvas.height = 2000;
    
    // Create Image from SVG
    const img = new Image();
    const svgBlob = new Blob([svgString], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = function() {
      // Calculate aspect ratio to fit SVG in canvas
      const svgRatio = img.width / img.height;
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (svgRatio > 1) {
        drawWidth = canvas.width * 0.8;
        drawHeight = drawWidth / svgRatio;
        offsetX = canvas.width * 0.1;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        drawHeight = canvas.height * 0.8;
        drawWidth = drawHeight * svgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = canvas.height * 0.1;
      }
      
      // Draw SVG to canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      
      // Get image data to sample pixels
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Prepare for separate stroke sampling
      let points = [];
      let colors = [];
      let strokePoints = [];
      let strokeColors = [];
      let fillPoints = [];
      let fillColors = [];
      
      // Sample points where pixels have alpha > 0
      const samplingStep = settings.particleDensity * 2;
      
      for (let y = 0; y < canvas.height; y += samplingStep) {
        for (let x = 0; x < canvas.width; x += samplingStep) {
          const index = (y * canvas.width + x) * 4;
          if (data[index + 3] > 50) {
            // Create point
            const depthFactor = Math.random();
            const z = settings.svgDepth > 0 ? (depthFactor - 0.5) * 2 * settings.svgDepth : 0;
            const point = new THREE.Vector3(
              (x - canvas.width / 2) * 0.1,
              -(y - canvas.height / 2) * 0.1,
              z
            );
            
            // Get color
            let color = null;
            if (settings.preserveColors) {
              color = \`rgb(\${data[index]}, \${data[index + 1]}, \${data[index + 2]})\`;
            }
            
            // Add to points
            points.push(point);
            colors.push(color);
            fillPoints.push(point);
            fillColors.push(color);
          }
        }
      }
      
      // If stroke detection is enabled
      if (settings.includeStrokes) {
        // Edge detection logic for strokes
        const edgeCanvas = document.createElement('canvas');
        const edgeCtx = edgeCanvas.getContext('2d');
        edgeCanvas.width = canvas.width;
        edgeCanvas.height = canvas.height;
        
        edgeCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        const edgeData = edgeCtx.getImageData(0, 0, canvas.width, canvas.height);
        const edgePixels = edgeData.data;
        
        const edgeSamplingStep = Math.max(1, samplingStep / settings.strokeDetail);
        
        for (let y = edgeSamplingStep; y < canvas.height - edgeSamplingStep; y += edgeSamplingStep) {
          for (let x = edgeSamplingStep; x < canvas.width - edgeSamplingStep; x += edgeSamplingStep) {
            const index = (y * canvas.width + x) * 4;
            
            if (edgePixels[index + 3] < 50) continue;
            
            // Check if it's an edge
            const isEdge = checkIfEdge(edgePixels, x, y, canvas.width);
            
            if (isEdge) {
              const depthFactor = Math.random();
              const z = settings.svgDepth > 0 ? (depthFactor - 0.5) * 2 * settings.svgDepth : 0;
              const point = new THREE.Vector3(
                (x - canvas.width / 2) * 0.1,
                -(y - canvas.height / 2) * 0.1,
                z
              );
              
              let color = null;
              if (settings.preserveColors) {
                color = \`rgb(\${edgePixels[index]}, \${edgePixels[index + 1]}, \${edgePixels[index + 2]})\`;
              }
              
              points.push(point);
              colors.push(color);
              strokePoints.push(point);
              strokeColors.push(color);
            }
          }
        }
      }
      
      // Edge detection helper
      function checkIfEdge(data, x, y, width) {
        const center = (y * width + x) * 4;
        
        if (data[center + 3] < 50) return false;
        
        const offsets = [
          [-1, -1], [0, -1], [1, -1],
          [-1,  0],          [1,  0],
          [-1,  1], [0,  1], [1,  1]
        ];
        
        for (const [dx, dy] of offsets) {
          const nx = x + dx;
          const ny = y + dy;
          const neighborIndex = (ny * width + nx) * 4;
          
          if (data[neighborIndex + 3] < 50) {
            return true; // It's an edge pixel
          }
        }
        
        return false;
      }
      
      // Create particles
      createParticles(
        layer, 
        points, 
        strokePoints, 
        fillPoints, 
        settings, 
        colors, 
        strokeColors, 
        fillColors
      );
      
      // Clean up
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  }
  
  // Create particles for a layer
  function createParticles(layer, points, strokePoints, fillPoints, settings, colors, strokeColors, fillColors) {
    // Sample points
    let sampledPoints = samplePoints(points, strokePoints, fillPoints, settings.particleCount, colors, strokeColors, fillColors);
    
    // Create particles
    if (layer.useInstanced && points.length > 500) {
      createInstancedParticles(layer, sampledPoints, settings);
    } else {
      createTraditionalParticles(layer, sampledPoints, settings);
    }
    
    // Apply scale
    layer.group.scale.set(settings.svgScale, settings.svgScale, settings.svgScale);
  }
  
  // Sample points for particle creation
  function samplePoints(points, strokePoints, fillPoints, targetCount, colors, strokeColors, fillColors) {
    let result = [];
    
    if (points.length <= targetCount) {
      // Use all points
      points.forEach((point, index) => {
        result.push({
          point: point,
          isStroke: strokePoints.includes(point),
          color: colors ? colors[index] : null
        });
      });
    } else {
      // Calculate proportions
      const strokeRatio = strokePoints.length / points.length;
      const strokeCount = Math.floor(targetCount * strokeRatio);
      const fillCount = targetCount - strokeCount;
      
      // Sample stroke points
      if (strokePoints.length > 0) {
        const strokeIndices = new Set();
        while (strokeIndices.size < Math.min(strokeCount, strokePoints.length)) {
          strokeIndices.add(Math.floor(Math.random() * strokePoints.length));
        }
        
        for (const index of strokeIndices) {
          result.push({
            point: strokePoints[index],
            isStroke: true,
            color: strokeColors ? strokeColors[index] : null
          });
        }
      }
      
      // Sample fill points
      if (fillPoints.length > 0) {
        const fillIndices = new Set();
        while (fillIndices.size < Math.min(fillCount, fillPoints.length)) {
          fillIndices.add(Math.floor(Math.random() * fillPoints.length));
        }
        
        for (const index of fillIndices) {
          result.push({
            point: fillPoints[index],
            isStroke: false,
            color: fillColors ? fillColors[index] : null
          });
        }
      }
    }
    
    return result;
  }
  
  // Create instanced particles
  function createInstancedParticles(layer, sampledPoints, settings) {
    // Group by color and type
    const groups = new Map();
    
    // Process points
    sampledPoints.forEach(data => {
      const isStroke = data.isStroke;
      let color;
      
      if (settings.preserveColors && data.color) {
        color = data.color;
      } else if (settings.useGradient) {
        const rotationRad = settings.gradientRotation * (Math.PI / 180);
        const normalizedX = (data.point.x + 100) / 200;
        const normalizedY = (data.point.y + 100) / 200;
        
        // Rotate the normalized coordinates
        const rotatedX = normalizedX * Math.cos(rotationRad) - normalizedY * Math.sin(rotationRad);
        const rotatedY = normalizedX * Math.sin(rotationRad) + normalizedY * Math.cos(rotationRad);
        
        // Use the rotated X coordinate for gradient interpolation
        const gradientPos = Math.max(0, Math.min(1, rotatedX));
        color = interpolateColor(settings.gradientColor1, settings.gradientColor2, gradientPos);
      } else {
        color = isStroke ? tintColor(settings.color, 1.2) : settings.color;
      }
      
      // Get key for grouping
      const key = \`\${color}_\${isStroke ? 'stroke' : 'fill'}\`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(data);
    });
    
    // Create instanced meshes for each group
    const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
    
    groups.forEach((particles, key) => {
      // Create material
      const [colorStr, type] = key.split('_');
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorStr),
        transparent: true,
        opacity: type === 'stroke' ? 0.9 : 0.8
      });
      
      // Create instanced mesh
      const instancedMesh = new THREE.InstancedMesh(sphereGeometry, material, particles.length);
      instancedMesh.frustumCulled = false;
      
      // Set matrices
      particles.forEach((data, i) => {
        const { point } = data;
        const sizeFactor = data.isStroke ? 0.8 : 1.0;
        const size = (settings.minSize + Math.random() * (settings.maxSize - settings.minSize)) * sizeFactor;
        
        const matrix = new THREE.Matrix4();
        matrix.makeTranslation(point.x, point.y, point.z);
        matrix.scale(new THREE.Vector3(size, size, size));
        instancedMesh.setMatrixAt(i, matrix);
        
        // Store animation data
        data.index = i;
        data.mesh = instancedMesh;
        data.size = size;
        data.originalPosition = point.clone();
        data.angle = Math.random() * Math.PI * 2;
        data.speed = 0.05 + Math.random() * 0.05;
        data.amplitude = Math.random() * 2;
        data.offset = new THREE.Vector3();
        data.velocity = new THREE.Vector3();
        data.noiseOffset = {
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          z: Math.random() * 1000
        };
      });
      
      instancedMesh.instanceMatrix.needsUpdate = true;
      
      // Add to layer
      layer.group.add(instancedMesh);
    });
    
    // Store particles data
    layer.particles = Array.from(groups.values()).flat();
  }
  
  // Create traditional particles
  function createTraditionalParticles(layer, sampledPoints, settings) {
    // Geometry and materials
    const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
    const materials = new Map();
    
    // Process points
    layer.particles = sampledPoints.map(data => {
      const { point, isStroke } = data;
      
      // Size
      const sizeFactor = isStroke ? 0.8 : 1.0;
      const size = (settings.minSize + Math.random() * (settings.maxSize - settings.minSize)) * sizeFactor;
      
      // Color
      let color;
      if (settings.preserveColors && data.color) {
        color = data.color;
      } else if (settings.useGradient) {
        const rotationRad = settings.gradientRotation * (Math.PI / 180);
        const normalizedX = (point.x + 100) / 200;
        const normalizedY = (point.y + 100) / 200;
        
        // Rotate the normalized coordinates
        const rotatedX = normalizedX * Math.cos(rotationRad) - normalizedY * Math.sin(rotationRad);
        const rotatedY = normalizedX * Math.sin(rotationRad) + normalizedY * Math.cos(rotationRad);
        
        // Use the rotated X coordinate for gradient interpolation
        const gradientPos = Math.max(0, Math.min(1, rotatedX));
        color = interpolateColor(settings.gradientColor1, settings.gradientColor2, gradientPos);
      } else {
        color = isStroke ? tintColor(settings.color, 1.2) : settings.color;
      }
      
      // Get or create material
      const materialKey = \`\${color}_\${isStroke ? 'stroke' : 'fill'}\`;
      if (!materials.has(materialKey)) {
        materials.set(materialKey, new THREE.MeshBasicMaterial({
          color: new THREE.Color(color),
          transparent: true,
          opacity: isStroke ? 0.9 : 0.8
        }));
      }
      
      // Create mesh
      const mesh = new THREE.Mesh(sphereGeometry, materials.get(materialKey));
      mesh.position.copy(point);
      mesh.scale.set(size, size, size);
      
      // Store data for animation
      data.mesh = mesh;
      data.size = size;
      data.originalPosition = point.clone();
      data.angle = Math.random() * Math.PI * 2;
      data.speed = 0.05 + Math.random() * 0.05;
      data.amplitude = Math.random() * 2;
      data.offset = new THREE.Vector3();
      data.velocity = new THREE.Vector3();
      data.noiseOffset = {
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        z: Math.random() * 1000
      };
      
      // Add to layer
      layer.group.add(mesh);
      
      return data;
    });
  }
  
  // Animation update
  function updateParticlesAnimation() {
    const time = performance.now() * 0.001 * ${i.animationSpeed} * 0.5;
    
    // Animation settings
    const settings = {
      noiseMovement: ${i.noiseMovement},
      noiseScale: ${i.noiseScale},
      mouseInteraction: ${i.mouseInteraction},
      repelEffect: ${i.repelEffect},
      interactionRadius: ${i.interactionRadius},
      interactionStrength: ${i.interactionStrength},
      sandEffect: ${i.sandEffect},
      sandStrength: ${i.sandStrength},
      sandReturn: ${i.sandReturn},
      svgDepth: ${i.svgDepth},
      animationSpeed: ${i.animationSpeed}
    };
    
    // Update all visible layers
    layers.forEach(layer => {
      if (!layer.visible) return;
      
      // Update particles in this layer
      layer.particles.forEach(particle => {
        updateParticle(particle, time, settings);
      });
    });
  }
  
  // Update a single particle
  function updateParticle(particle, time, settings) {
    const { mesh, originalPosition, isStroke, noiseOffset } = particle;
    
    // Skip if mesh doesn't exist
    if (!mesh) return;
    
    // For instanced meshes
    if (mesh instanceof THREE.InstancedMesh) {
      updateInstancedParticle(particle, time, settings);
      return;
    }
    
    // For regular meshes
    const currentPosition = mesh.position.clone();
    let newPosition = originalPosition.clone();
    
    // Apply animation
    if (settings.noiseMovement) {
      // Update noise offsets
      particle.noiseOffset.x += 0.002 * settings.animationSpeed;
      particle.noiseOffset.y += 0.002 * settings.animationSpeed;
      particle.noiseOffset.z += 0.002 * settings.animationSpeed;
      
      // Get 3D noise
      const noiseX = simplex.noise3D(
        particle.noiseOffset.x, 
        particle.noiseOffset.y, 
        0
      ) * settings.noiseScale * 100;
      
      const noiseY = simplex.noise3D(
        particle.noiseOffset.y, 
        particle.noiseOffset.z, 
        0
      ) * settings.noiseScale * 100;
      
      const noiseZ = simplex.noise3D(
        particle.noiseOffset.z, 
        particle.noiseOffset.x, 
        0
      ) * settings.noiseScale * 50;
      
      // Apply noise
      particle.offset.set(
        noiseX,
        noiseY,
        noiseZ * (settings.svgDepth > 0 ? 1 : 0)
      );
      
      newPosition.add(particle.offset);
    } else {
      // Sine wave animation
      particle.angle += particle.speed * settings.animationSpeed;
      
      particle.offset.x = Math.sin(particle.angle + time) * particle.amplitude;
      particle.offset.y = Math.cos(particle.angle + time * 1.5) * particle.amplitude;
      
      if (settings.svgDepth > 0) {
        particle.offset.z = Math.sin(particle.angle + time * 0.7) * particle.amplitude * 0.5;
      }
      
      newPosition.add(particle.offset);
    }
    
    // Strokes move more
    if (isStroke) {
      particle.offset.multiplyScalar(1.2);
    }
    
    // Mouse interaction
    if (settings.mouseInteraction && mouseMoved && mousePosition.length() > 0) {
      const distanceToMouse = mesh.position.distanceTo(mousePosition);
      const scale = mesh.parent ? mesh.parent.scale.x : 1;
      
      if (distanceToMouse < settings.interactionRadius * scale) {
        const forceFactor = (settings.interactionRadius * scale - distanceToMouse) / (settings.interactionRadius * scale);
        const force = settings.interactionStrength * forceFactor;
        
        const forceDirection = new THREE.Vector3()
          .subVectors(mesh.position, mousePosition)
          .normalize()
          .multiplyScalar(force);
        
        if (settings.repelEffect) {
          newPosition.add(forceDirection);
        } else {
          newPosition.sub(forceDirection);
        }
        
        // Sand effect
        if (settings.sandEffect) {
          if (settings.repelEffect) {
            particle.velocity.add(forceDirection.multiplyScalar(settings.sandStrength * 0.1));
          } else {
            particle.velocity.sub(forceDirection.multiplyScalar(settings.sandStrength * 0.1));
          }
        }
      }
    }
    
    // Rigid body interaction
    if (rigidBody.active) {
      const distanceToRigidBody = mesh.position.distanceTo(rigidBody.position);
      
      if (distanceToRigidBody < rigidBody.size) {
        const forceFactor = (rigidBody.size - distanceToRigidBody) / rigidBody.size;
        const force = rigidBody.force * forceFactor;
        
        const forceDirection = new THREE.Vector3()
          .subVectors(mesh.position, rigidBody.position)
          .normalize()
          .multiplyScalar(force);
        
        newPosition.add(forceDirection);
        particle.velocity.add(forceDirection.multiplyScalar(0.1));
      }
    }
    
    // Sand physics
    if (settings.sandEffect || rigidBody.active) {
      const targetPosition = originalPosition.clone().add(particle.offset);
      const direction = targetPosition.clone().sub(currentPosition);
      
      const returnSpeed = rigidBody.active ? rigidBody.returnSpeed : settings.sandReturn;
      const returnForce = direction.multiplyScalar(0.05 * returnSpeed);
      particle.velocity.add(returnForce);
      
      particle.velocity.multiplyScalar(0.95);
      
      newPosition = currentPosition.clone().add(particle.velocity);
    }
    
    // Update position
    mesh.position.copy(newPosition);
    
    // Add rotation
    mesh.rotation.x += 0.01 * settings.animationSpeed;
    mesh.rotation.y += 0.01 * settings.animationSpeed;
  }
  
  // Update an instanced particle
  function updateInstancedParticle(particle, time, settings) {
    const { mesh, originalPosition, index } = particle;
    
    // Get current matrix
    const matrix = new THREE.Matrix4();
    mesh.getMatrixAt(index, matrix);
    
    // Extract current position and scale
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    matrix.decompose(position, rotation, scale);
    
    // Calculate new position
    let newPosition = originalPosition.clone();
    
    // Apply animation
    if (settings.noiseMovement) {
      // Update noise offsets
      particle.noiseOffset.x += 0.002 * settings.animationSpeed;
      particle.noiseOffset.y += 0.002 * settings.animationSpeed;
      particle.noiseOffset.z += 0.002 * settings.animationSpeed;
      
      // Get 3D noise
      const noiseX = simplex.noise3D(
        particle.noiseOffset.x, 
        particle.noiseOffset.y, 
        0
      ) * settings.noiseScale * 100;
      
      const noiseY = simplex.noise3D(
        particle.noiseOffset.y, 
        particle.noiseOffset.z, 
        0
      ) * settings.noiseScale * 100;
      
      const noiseZ = simplex.noise3D(
        particle.noiseOffset.z, 
        particle.noiseOffset.x, 
        0
      ) * settings.noiseScale * 50;
      
      // Apply noise
      particle.offset.set(
        noiseX,
        noiseY,
        noiseZ * (settings.svgDepth > 0 ? 1 : 0)
      );
      
      newPosition.add(particle.offset);
    } else {
      // Sine wave animation
      particle.angle += particle.speed * settings.animationSpeed;
      
      particle.offset.x = Math.sin(particle.angle + time) * particle.amplitude;
      particle.offset.y = Math.cos(particle.angle + time * 1.5) * particle.amplitude;
      
      if (settings.svgDepth > 0) {
        particle.offset.z = Math.sin(particle.angle + time * 0.7) * particle.amplitude * 0.5;
      }
      
      newPosition.add(particle.offset);
    }
    
    // Strokes move more
    if (particle.isStroke) {
      particle.offset.multiplyScalar(1.2);
    }
    
    // Mouse interaction
    if (settings.mouseInteraction && mouseMoved && mousePosition.length() > 0) {
      const distanceToMouse = position.distanceTo(mousePosition);
      const parentScale = mesh.parent ? mesh.parent.scale.x : 1;
      
      if (distanceToMouse < settings.interactionRadius * parentScale) {
        const forceFactor = (settings.interactionRadius * parentScale - distanceToMouse) / (settings.interactionRadius * parentScale);
        const force = settings.interactionStrength * forceFactor;
        
        const forceDirection = new THREE.Vector3()
          .subVectors(position, mousePosition)
          .normalize()
          .multiplyScalar(force);
        
        if (settings.repelEffect) {
          newPosition.add(forceDirection);
        } else {
          newPosition.sub(forceDirection);
        }
        
        // Sand effect
        if (settings.sandEffect) {
          if (settings.repelEffect) {
            particle.velocity.add(forceDirection.multiplyScalar(settings.sandStrength * 0.1));
          } else {
            particle.velocity.sub(forceDirection.multiplyScalar(settings.sandStrength * 0.1));
          }
        }
      }
    }
    
    // Rigid body interaction
    if (rigidBody.active) {
      const distanceToRigidBody = position.distanceTo(rigidBody.position);
      
      if (distanceToRigidBody < rigidBody.size) {
        const forceFactor = (rigidBody.size - distanceToRigidBody) / rigidBody.size;
        const force = rigidBody.force * forceFactor;
        
        const forceDirection = new THREE.Vector3()
          .subVectors(position, rigidBody.position)
          .normalize()
          .multiplyScalar(force);
        
        newPosition.add(forceDirection);
        particle.velocity.add(forceDirection.multiplyScalar(0.1));
      }
    }
    
    // Sand physics
    if (settings.sandEffect || rigidBody.active) {
      const targetPosition = originalPosition.clone().add(particle.offset);
      const direction = targetPosition.clone().sub(position);
      
      const returnSpeed = rigidBody.active ? rigidBody.returnSpeed : settings.sandReturn;
      const returnForce = direction.multiplyScalar(0.05 * returnSpeed);
      particle.velocity.add(returnForce);
      
      particle.velocity.multiplyScalar(0.95);
      
      newPosition = position.clone().add(particle.velocity);
    }
    
    // Create new matrix
    const newMatrix = new THREE.Matrix4();
    newMatrix.makeTranslation(newPosition.x, newPosition.y, newPosition.z);
    
    // Add rotation
    const rotX = new THREE.Matrix4().makeRotationX(0.01 * settings.animationSpeed);
    const rotY = new THREE.Matrix4().makeRotationY(0.01 * settings.animationSpeed);
    newMatrix.multiply(rotX).multiply(rotY);
    
    // Apply scale
    newMatrix.scale(scale);
    
    // Update instance matrix
    mesh.setMatrixAt(index, newMatrix);
    mesh.instanceMatrix.needsUpdate = true;
  }
  
  // Helper for color interpolation
  function interpolateColor(color1, color2, factor) {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    return new THREE.Color().lerpColors(c1, c2, factor).getStyle();
  }
  
  // Helper to tint a color
  function tintColor(color, factor) {
    const c = new THREE.Color(color).multiplyScalar(factor);
    return c.getStyle();
  }
  
  // Return public API
  return {
    init: init,
    addSVGLayer: addSVGLayer
  };
})();

// Example usage:
// 1. Initialize the particle system
document.addEventListener('DOMContentLoaded', function() {
  ParticleSystem.init('your-container-id');
  
  // 2. Add SVG layers
  const svgData = \`${e.layers.length>0?e.layers[0].svgString?.replace(/\\/g,"\\\\").replace(/\`/g,"\\`").substring(0,500)+"...":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="white" stroke-width="2"/></svg>'}\`;
  
  // Add your SVG with position and rotation
  ParticleSystem.addSVGLayer(
    svgData, 
    'Main Layer', 
    { x: 0, y: 0, z: 0 }, 
    { x: 0, y: 0, z: 0 }
  );
});`;return t.codeEl&&(t.codeEl.textContent=n),n}catch(r){return console.error("Error generating code:",r),t.codeEl&&(t.codeEl.textContent="// Error generating code. Please try again."),Y("Error generating code","error"),""}}function F(e,t,i){let o=new THREE.Color(e),n=new THREE.Color(t);return new THREE.Color().lerpColors(o,n,i).getStyle()}function O(e,t){return new THREE.Color(e).multiplyScalar(t).getStyle()}function A(){try{let t=document.querySelector(".footer"),i=document.querySelector(".canvas-controls"),o=document.querySelector(".performance-stats"),n=document.querySelector(".rigid-body-indicator");t&&(t.style.display="none"),i&&(i.style.display="none"),o&&(o.style.display="none"),n&&(n.style.display="none");let r=e.rigidBody.mesh&&e.rigidBody.mesh.visible;e.rigidBody.mesh&&(e.rigidBody.mesh.visible=!1);let a=document.getElementById("glow-effect");a&&a.checked&&e.composer?e.composer.render():e.renderer.render(e.scene,e.camera);let s=e.renderer.domElement.toDataURL("image/png"),l=document.createElement("a");l.href=s,l.download="partycle-export.png",document.body.appendChild(l),l.click(),document.body.removeChild(l),t&&(t.style.display=""),i&&(i.style.display=""),o&&(o.style.display=""),n&&(n.style.display=""),e.rigidBody.mesh&&(e.rigidBody.mesh.visible=r),Y("Screenshot saved!","success")}catch(d){console.error("Error taking screenshot:",d),Y("Error taking screenshot","error")}}function X(){try{Y("Starting GIF capture... This may take a moment","info");let t=document.querySelector(".footer"),i=document.querySelector(".canvas-controls"),o=document.querySelector(".performance-stats"),n=document.querySelector(".rigid-body-indicator");t&&(t.style.display="none"),i&&(i.style.display="none"),o&&(o.style.display="none"),n&&(n.style.display="none");let r=e.rigidBody.mesh&&e.rigidBody.mesh.visible;if(e.rigidBody.mesh&&(e.rigidBody.mesh.visible=!1),"undefined"==typeof GIF){let a=document.createElement("script");a.src="https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js",a.onload=()=>s(),document.head.appendChild(a)}else s();function s(){let a=new GIF({workers:4,quality:10,width:800,height:600,workerScript:"https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js"}),s=0;!function l(){document.getElementById("glow-effect").checked?e.composer.render():e.renderer.render(e.scene,e.camera),a.addFrame(e.renderer.domElement,{copy:!0,delay:33}),++s<60?requestAnimationFrame(l):(Y("Rendering GIF...","info"),a.on("finished",function(a){let s=URL.createObjectURL(a),l=document.createElement("a");l.href=s,l.download="partycle-animation.gif",document.body.appendChild(l),l.click(),document.body.removeChild(l),URL.revokeObjectURL(s),t&&(t.style.display=""),i&&(i.style.display=""),o&&(o.style.display=""),n&&(n.style.display=""),e.rigidBody.mesh&&(e.rigidBody.mesh.visible=r),Y("GIF saved!","success")}),a.render())}()}}catch(l){console.error("Error exporting GIF:",l),Y("Error exporting GIF","error");let d=document.querySelector(".footer"),c=document.querySelector(".canvas-controls"),p=document.querySelector(".performance-stats"),g=document.querySelector(".rigid-body-indicator");d&&(d.style.display=""),c&&(c.style.display=""),p&&(p.style.display=""),g&&(g.style.display=""),e.rigidBody.mesh&&(e.rigidBody.mesh.visible=!0)}}function Y(e,i="success"){if(t.notification){switch(t.notification.textContent=e,t.notification.className="notification",t.notification.classList.add(`notification-${i}`),i){case"success":t.notification.style.borderLeftColor="var(--success)";break;case"warning":t.notification.style.borderLeftColor="var(--warning)";break;case"error":t.notification.style.borderLeftColor="var(--danger)";break;default:t.notification.style.borderLeftColor="var(--primary)"}t.notification.classList.add("active"),setTimeout(()=>{t.notification.classList.remove("active")},3e3)}}return{init:function d(){e.scene=new THREE.Scene,e.scene.background=new THREE.Color("#0a0a18"),e.camera=new THREE.PerspectiveCamera(60,f(),.1,1e3),e.camera.position.z=200,e.renderer=new THREE.WebGLRenderer({antialias:!0,powerPreference:"high-performance",precision:"highp"}),e.renderer.setPixelRatio(window.devicePixelRatio),e.renderer.setSize(t.sceneContainer.clientWidth,t.sceneContainer.clientHeight),t.sceneContainer.appendChild(e.renderer.domElement),function i(){e.composer=new THREE.EffectComposer(e.renderer);let o=new THREE.RenderPass(e.scene,e.camera);e.composer.addPass(o),e.bloomPass=new THREE.UnrealBloomPass(new THREE.Vector2(t.sceneContainer.clientWidth,t.sceneContainer.clientHeight),.9,.4,.85),e.composer.addPass(e.bloomPass),n()}(),e.controls=new THREE.OrbitControls(e.camera,e.renderer.domElement),e.controls.enableDamping=!0,e.controls.dampingFactor=.1,e.controls.screenSpacePanning=!0,e.controls.minDistance=50,e.controls.maxDistance=500,p(),i.particleGeometry=new THREE.SphereGeometry(1,16,16),i.disposables.push(i.particleGeometry),window.addEventListener("resize",h),["dragenter","dragover","dragleave","drop"].forEach(e=>{t.sceneContainer.addEventListener(e,r,!1),document.body.addEventListener(e,r,!1)}),["dragenter","dragover"].forEach(e=>{t.sceneContainer.addEventListener(e,()=>{t.sceneContainer.classList.add("drag-over")},!1)}),["dragleave","drop"].forEach(e=>{t.sceneContainer.addEventListener(e,()=>{t.sceneContainer.classList.remove("drag-over")},!1)}),t.sceneContainer.addEventListener("drop",a,!1),t.dropArea&&t.dropArea.addEventListener("click",()=>{t.svgInput.click()}),function i(){let o=document.querySelectorAll(".tab-button"),r=document.querySelectorAll(".tab-content");o.forEach(e=>{e.addEventListener("click",()=>{let t=e.getAttribute("data-tab");o.forEach(e=>e.classList.remove("active")),e.classList.add("active"),r.forEach(e=>e.classList.remove("active")),document.getElementById(`${t}-tab`).classList.add("active")})}),t.svgInput&&t.svgInput.addEventListener("change",()=>{t.svgInput.files.length>0?(t.svgFileName.textContent=t.svgInput.files[0].name,b(t.svgInput.files[0])):t.svgFileName.textContent="No file selected"}),t.addSvgBtn&&t.addSvgBtn.addEventListener("click",()=>{t.svgInput.click()}),t.generateBtn&&t.generateBtn.addEventListener("click",_),t.resetBtn&&t.resetBtn.addEventListener("click",V),t.resetCameraBtn&&t.resetCameraBtn.addEventListener("click",$),t.sandEffectCheckbox&&t.sandEffectCheckbox.addEventListener("change",function(){x()}),t.enableOrbitCheckbox&&t.enableOrbitCheckbox.addEventListener("change",p),t.exportCodeBtn&&t.exportCodeBtn.addEventListener("click",()=>{H(),t.codeModal.classList.add("active")}),t.closeModalBtn&&t.closeModalBtn.addEventListener("click",()=>{t.codeModal.classList.remove("active")}),t.copyCodeBtn&&t.copyCodeBtn.addEventListener("click",G),t.exportGifBtn&&t.exportGifBtn.addEventListener("click",X),t.codeModal&&t.codeModal.addEventListener("click",e=>{e.target===t.codeModal&&t.codeModal.classList.remove("active")}),t.useGradientCheckbox&&t.useGradientCheckbox.addEventListener("change",()=>{t.useGradientCheckbox.checked?(t.solidColorControl.style.display="none",t.gradientControls.style.display="block"):(t.solidColorControl.style.display="block",t.gradientControls.style.display="none"),x()}),t.layerPositionX&&(t.layerPositionX.addEventListener("input",l),t.layerPositionY.addEventListener("input",l),t.layerPositionZ.addEventListener("input",l),t.layerRotationX.addEventListener("input",l),t.layerRotationY.addEventListener("input",l),t.layerRotationZ.addEventListener("input",l)),t.enableRigidBody&&(t.enableRigidBody.addEventListener("change",s),t.rigidBodySize.addEventListener("input",s),t.rigidBodyForce.addEventListener("input",s),t.rigidBodyReturn.addEventListener("input",s),t.rigidBodyX.addEventListener("input",s),t.rigidBodyY.addEventListener("input",s),t.rigidBodyZ.addEventListener("input",s));let a=document.querySelectorAll('[data-live="true"]');a.forEach(t=>{if("range"===t.type){let i=document.getElementById(`${t.id}-value`);if(i){let o=parseFloat(t.step)||1;i.textContent=u(t.value,o,"gradient-rotation"===t.id?"\xb0":""),t.addEventListener("input",()=>{var r,a;i.textContent=u(t.value,o,"gradient-rotation"===t.id?"\xb0":""),"svg-scale"===t.id?(r=parseFloat(t.value),e.layers.forEach(e=>{if(e.group){let t=e.group.position.clone(),i=e.group.rotation.clone();e.group.scale.set(r,r,r),e.group.position.copy(t),e.group.rotation.copy(i)}}),H()):"svg-depth"===t.id?(a=parseInt(t.value),e.layers.forEach(e=>{(function e(t,i){if(t.particles&&0!==t.particles.length){if(t.useInstanced){for(let o=0;o<t.particleCount;o++){let n=t.instanceData[o].depthFactor,r=i*(n-.5)*2;t.particles.setMatrixAt(o,new THREE.Matrix4().makeTranslation(t.instanceData[o].originalPosition.x,t.instanceData[o].originalPosition.y,r))}t.particles.instanceMatrix.needsUpdate=!0}else t.particles.forEach((e,o)=>{let n=e.userData.depthFactor||Math.random();e.userData.depthFactor=n;let r=i*(n-.5)*2;e.position.z=r,e.userData.originalPosition&&(e.userData.originalPosition.z=r),t.originalPositions&&t.originalPositions[o]&&(t.originalPositions[o].z=r)})}})(e,a)}),H()):"bloom-strength"===t.id||"bloom-radius"===t.id||"bloom-threshold"===t.id?n():"orbit-sensitivity"===t.id||"zoom-speed"===t.id||"pan-speed"===t.id?p():S()})}}else t.addEventListener("change",e=>{"glow-effect"===e.target.id?n():"enable-orbit"===e.target.id||e.target.id.startsWith("orbit-")?p():S()})}),e.renderer&&e.renderer.domElement&&(e.renderer.domElement.addEventListener("mousemove",g),e.renderer.domElement.addEventListener("touchmove",m),e.renderer.domElement.addEventListener("mouseleave",y)),t.screenshotBtn&&t.screenshotBtn.addEventListener("click",A),document.querySelectorAll(".theme-btn").forEach(e=>{e.addEventListener("click",()=>{(function e(i){try{let o;switch(i){case"sunset":o={primary:"#ff7e5f",secondary:"#feb47b"};break;case"ocean":o={primary:"#2193b0",secondary:"#6dd5ed"};break;case"forest":o={primary:"#5adb94",secondary:"#2bde73"};break;case"purple":o={primary:"#8e44ad",secondary:"#9b59b6"};break;default:o={primary:"#5756d5",secondary:"#d956aa"}}let n=document.getElementById("gradient-color1"),r=document.getElementById("gradient-color2"),a=document.getElementById("use-gradient");n&&(n.value=o.primary),r&&(r.value=o.secondary),a&&(a.checked=!0),t.solidColorControl&&(t.solidColorControl.style.display="none"),t.gradientControls&&(t.gradientControls.style.display="block"),x(),Y(`Applied ${i} theme`,"success")}catch(s){console.error("Error applying color theme:",s),Y("Error applying theme","error")}})(e.dataset.theme)})})}(),requestAnimationFrame(L),e.simplex=new SimplexNoise,function t(){let i=new THREE.SphereGeometry(1,32,32),n=new THREE.MeshBasicMaterial({color:new THREE.Color(5723861),transparent:!0,opacity:.2,wireframe:!0});e.rigidBody.mesh=new THREE.Mesh(i,n),e.rigidBody.mesh.visible=!1,e.scene.add(e.rigidBody.mesh),o()}()},dispose:function t(){try{e.layers.forEach(t=>{w(t),t.group&&e.scene.remove(t.group)}),e.layers=[],i.disposables.forEach(e=>{e&&"function"==typeof e.dispose&&e.dispose()}),i.disposables=[],i.materialCache.clear(),e.rigidBody.mesh&&(e.scene.remove(e.rigidBody.mesh),e.rigidBody.mesh.geometry&&e.rigidBody.mesh.geometry.dispose(),e.rigidBody.mesh.material&&e.rigidBody.mesh.material.dispose(),e.rigidBody.mesh=null),e.renderer&&(e.renderer.dispose(),e.renderer.domElement.remove()),e.composer&&(e.composer.renderTarget1.dispose(),e.composer.renderTarget2.dispose()),e.controls&&e.controls.dispose(),e.camera=null,e.scene=null,e.renderer=null,e.controls=null,e.composer=null,e.bloomPass=null}catch(o){console.error("Error disposing resources:",o)}},generateParticles:_,resetSettings:V,takeScreenshot:A,exportGif:X,exportCode:H}}();document.addEventListener("DOMContentLoaded",ParticleApp.init);
