// main.js pour Vite + Three.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Récupérer le canvas
const canvas = document.getElementById('globeCanvas');
const parent = canvas.parentElement;

// Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(75, parent.clientWidth / parent.clientHeight, 0.1, 1000);
camera.position.z = 2;

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setSize(parent.clientWidth, parent.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Contrôles
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Globe filaire
const globeMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 64),
    new THREE.MeshBasicMaterial({ color: 0x222222, wireframe: true, opacity: 0.3, transparent: true })
);
scene.add(globeMesh);

// Couleurs continents
const continentColors = {
    'Europe': 0x289EB5,
    'Asia': 0x97C728,
    'Africa': 0xE3A41B,
    'North America': 0x239172,
    'South America': 0x088C1E,
    'Oceania': 0xCC99FF,
    'default': 0x888888
};

// Charger le JSON
fetch('/src/assets/custom.geo.json')
.then(res => res.json())
.then(countries => {
    countries.features.forEach(country => {
        let polygons = country.geometry.type === 'Polygon' ? [country.geometry.coordinates] :
                       country.geometry.type === 'MultiPolygon' ? country.geometry.coordinates : [];
        const color = continentColors[country.properties.continent] || continentColors.default;

        polygons.forEach(polygon => {
            polygon.forEach(ring => {
                const points = ring.map(([lon, lat]) => {
                    const phi = (90 - lat) * (Math.PI / 180);
                    const theta = (lon + 180) * (Math.PI / 180);
                    return new THREE.Vector3(
                        -1.01 * Math.sin(phi) * Math.cos(theta),
                         1.01 * Math.cos(phi),
                         1.01 * Math.sin(phi) * Math.sin(theta)
                    );
                });
                points.push(points[0].clone());
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 }));
                line.userData.isCountry = true;
                scene.add(line);
            });
        });
    });

    // Animation
    function animate() {
        requestAnimationFrame(animate);
        globeMesh.rotation.y += 0.0005;
        scene.traverse(obj => { if(obj.userData.isCountry) obj.rotation.y += 0.0005; });
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
})
.catch(err => console.error("Erreur chargement JSON :", err));

// Resize
window.addEventListener('resize', () => {
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});
