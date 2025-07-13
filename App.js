import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Added .js extension

// Main App Component
const App = () => {
    const [dnaElements, setDnaElements] = useState([]);
    const [crisprInputSequence, setCrisprInputSequence] = useState('');
    const [crisprResults, setCrisprResults] = useState('');
    const [isLoadingCrispr, setIsLoadingCrispr] = useState(false);
    const [viewerType, setViewerType] = useState('dna'); // 'dna' or 'organoid'

    // Function to add a DNA element
    const addDnaElement = (type) => {
        setDnaElements([...dnaElements, { id: Date.now(), type, name: `${type} ${dnaElements.length + 1}` }]);
    };

    // Function to remove a DNA element
    const removeDnaElement = (id) => {
        setDnaElements(dnaElements.filter(el => el.id !== id));
    };

    // Function to handle CRISPR analysis using LLM
    const analyzeCrispr = async () => {
        if (!crisprInputSequence.trim()) {
            setCrisprResults('Please enter a DNA sequence to analyze.');
            return;
        }

        setIsLoadingCrispr(true);
        setCrisprResults('Analyzing sequence...');

        try {
            const prompt = `Given the following DNA sequence, identify all "NGG" PAM sites and suggest potential gRNA sequences (20 nucleotides immediately preceding the NGG PAM site, on the 5' to 3' strand). Also, predict any potential off-target sites if the sequence is very short or repetitive, assuming a simple search for similar sequences.

DNA Sequence:
${crisprInputSequence}

Format your response clearly, listing PAM sites and corresponding gRNAs.`;

            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });
            const payload = { contents: chatHistory };
            const apiKey = ""; // Canvas will provide this at runtime
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API error: ${response.status} - ${errorData.error.message}`);
            }

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                setCrisprResults(text);
            } else {
                setCrisprResults('No valid response from AI. Please try again.');
            }
        } catch (error) {
            console.error('Error analyzing CRISPR:', error);
            setCrisprResults(`Error: ${error.message}. Could not analyze sequence.`);
        } finally {
            setIsLoadingCrispr(false);
        }
    };

    // Export functions (placeholders for MVP)
    const exportData = (format) => {
        let dataToExport = '';
        switch (format) {
            case 'FASTA':
                dataToExport = `>BioSynth_Design\n${dnaElements.map(el => el.name).join('\n')}\n\nCRISPR Input:\n${crisprInputSequence}\n\nCRISPR Results:\n${crisprResults}`;
                break;
            case 'GenBank':
                dataToExport = `LOCUS       BioSynth_Design\nFEATURES   Source\n            /note="Designed DNA Nanorobot/Organoid"\n${dnaElements.map(el => `     gene            1..${el.name.length}\n                     /gene="${el.name}"`).join('\n')}`;
                break;
            case 'SBOL':
                dataToExport = `<sbol:Collection>\n  <sbol:displayId>BioSynth_Design</sbol:displayId>\n  <sbol:component>${dnaElements.map(el => el.name).join(', ')}</sbol:component>\n</sbol:Collection>`;
                break;
            case 'STL':
                dataToExport = '3D model data (STL format) would be generated here based on the 3D viewer content.';
                break;
            default:
                dataToExport = 'Unsupported format.';
        }
        // In a real app, you'd trigger a file download. For now, we'll log or display.
        console.log(`Exporting as ${format}:\n`, dataToExport);
        alert(`Exporting as ${format}. Check console for data or imagine a download!`);
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans antialiased text-gray-800 p-4 flex flex-col">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-lg shadow-lg mb-6">
                <h1 className="text-4xl font-extrabold text-center tracking-tight">BioSynth Designer</h1>
                <p className="text-xl text-center mt-2 opacity-90">Design DNA Nanorobots & Organoids</p>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row flex-grow gap-6">
                {/* Left Panel: DNA Editor & CRISPR Tool */}
                <div className="flex flex-col w-full lg:w-1/2 gap-6">
                    {/* DNA Editor */}
                    <div className="bg-white p-6 rounded-lg shadow-md flex-grow">
                        <h2 className="text-2xl font-semibold text-blue-700 mb-4">DNA Editor</h2>
                        <p className="text-gray-600 mb-4">Add and arrange genetic elements for your design.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                            <button
                                onClick={() => addDnaElement('Gene')}
                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-200 ease-in-out transform hover:scale-105"
                            >
                                Add Gene
                            </button>
                            <button
                                onClick={() => addDnaElement('Promoter')}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-200 ease-in-out transform hover:scale-105"
                            >
                                Add Promoter
                            </button>
                            <button
                                onClick={() => addDnaElement('CRISPR Guide')}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-200 ease-in-out transform hover:scale-105"
                            >
                                Add CRISPR Guide
                            </button>
                            <button
                                onClick={() => addDnaElement('Terminator')}
                                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-200 ease-in-out transform hover:scale-105"
                            >
                                Add Terminator
                            </button>
                            <button
                                onClick={() => addDnaElement('Reporter')}
                                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-200 ease-in-out transform hover:scale-105"
                            >
                                Add Reporter
                            </button>
                            <button
                                onClick={() => addDnaElement('Linker')}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-200 ease-in-out transform hover:scale-105"
                            >
                                Add Linker
                            </button>
                        </div>
                        <div className="border border-gray-300 rounded-md p-4 bg-gray-50 min-h-[150px] overflow-y-auto">
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Current DNA Construct:</h3>
                            {dnaElements.length === 0 ? (
                                <p className="text-gray-500 italic">No elements added yet. Use the buttons above!</p>
                            ) : (
                                <ul className="space-y-2">
                                    {dnaElements.map((el) => (
                                        <li key={el.id} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm border border-gray-200">
                                            <span className="font-medium text-gray-800">{el.name} ({el.type})</span>
                                            <button
                                                onClick={() => removeDnaElement(el.id)}
                                                className="text-red-500 hover:text-red-700 text-sm font-semibold ml-4"
                                            >
                                                Remove
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* CRISPR Targeting Tool */}
                    <div className="bg-white p-6 rounded-lg shadow-md flex-grow">
                        <h2 className="text-2xl font-semibold text-blue-700 mb-4">CRISPR Targeting</h2>
                        <p className="text-gray-600 mb-4">Enter a DNA sequence to find PAM sites and design gRNAs.</p>
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mb-4 resize-y min-h-[100px]"
                            placeholder="Enter DNA sequence (e.g., ATGCATGCATGC...)"
                            value={crisprInputSequence}
                            onChange={(e) => setCrisprInputSequence(e.target.value)}
                        ></textarea>
                        <button
                            onClick={analyzeCrispr}
                            disabled={isLoadingCrispr}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md shadow-md transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoadingCrispr ? 'Analyzing...' : 'Analyze Sequence'}
                        </button>
                        <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded-md min-h-[100px] overflow-y-auto whitespace-pre-wrap text-sm text-gray-700">
                            {crisprResults || 'Results will appear here.'}
                        </div>
                    </div>
                </div>

                {/* Right Panel: 3D Viewer & Export Tools */}
                <div className="flex flex-col w-full lg:w-1/2 gap-6">
                    {/* 3D Viewer */}
                    <div className="bg-white p-6 rounded-lg shadow-md flex-grow">
                        <h2 className="text-2xl font-semibold text-blue-700 mb-4">3D Viewer</h2>
                        <p className="text-gray-600 mb-4">Visualize your DNA nanostructures or organoids.</p>
                        <div className="flex justify-center gap-4 mb-4">
                            <button
                                onClick={() => setViewerType('dna')}
                                className={`py-2 px-4 rounded-md font-semibold transition duration-200 ${viewerType === 'dna' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                DNA Nanostructure
                            </button>
                            <button
                                onClick={() => setViewerType('organoid')}
                                className={`py-2 px-4 rounded-md font-semibold transition duration-200 ${viewerType === 'organoid' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                Organoid
                            </button>
                        </div>
                        <ThreeDViewer type={viewerType} />
                    </div>

                    {/* Export Tools */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-blue-700 mb-4">Export Tools</h2>
                        <p className="text-gray-600 mb-4">Save your design in various formats.</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => exportData('FASTA')}
                                className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-md shadow-sm transition duration-200 ease-in-out transform hover:scale-105"
                            >
                                Export FASTA
                            </button>
                            <button
                                onClick={() => exportData('GenBank')}
                                className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-md shadow-sm transition duration-200 ease-in-out transform hover:scale-105"
                            >
                                Export GenBank
                            </button>
                            <button
                                onClick={() => exportData('SBOL')}
                                className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-md shadow-sm transition duration-200 ease-in-out transform hover:scale-105"
                            >
                                Export SBOL
                            </button>
                            <button
                                onClick={() => exportData('STL')}
                                className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-md shadow-sm transition duration-200 ease-in-out transform hover:scale-105"
                            >
                                Export 3D (STL)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3D Viewer Component
const ThreeDViewer = ({ type }) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const animationFrameIdRef = useRef(null);

    const animate = useCallback(() => {
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
        animationFrameIdRef.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        // Scene, Camera, Renderer setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = new THREE.Color(0xf0f0f0); // Light gray background

        const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        cameraRef.current = camera;
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        rendererRef.current = renderer;
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(renderer.domElement);

        // OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controlsRef.current = controls;
        controls.enableDamping = true; // an animation loop is required when damping is enabled
        controls.dampingFactor = 0.25;
        controls.screenSpacePanning = false;
        controls.maxPolarAngle = Math.PI / 2; // Prevent camera from going below the ground

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Soft white light
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 10, 5).normalize();
        scene.add(directionalLight);

        // Handle window resize
        const onWindowResize = () => {
            if (currentMount && cameraRef.current && rendererRef.current) {
                cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
                cameraRef.current.updateProjectionMatrix();
                rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
            }
        };
        window.addEventListener('resize', onWindowResize);

        // Start animation loop
        animate();

        // Cleanup
        return () => {
            cancelAnimationFrame(animationFrameIdRef.current);
            window.removeEventListener('resize', onWindowResize);
            if (currentMount && renderer.domElement) {
                currentMount.removeChild(renderer.domElement);
            }
            renderer.dispose();
            controls.dispose();
            // Dispose of all objects in the scene
            scene.traverse((object) => {
                if (object.isMesh) {
                    object.geometry.dispose();
                    if (object.material.isMaterial) {
                        object.material.dispose();
                    } else if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    }
                }
            });
        };
    }, [animate]); // Dependency array includes animate to ensure it's stable

    useEffect(() => {
        // Clear previous objects
        if (sceneRef.current) {
            while (sceneRef.current.children.length > 0) {
                const object = sceneRef.current.children[0];
                if (object.isMesh) {
                    object.geometry.dispose();
                    if (object.material.isMaterial) {
                        object.material.dispose();
                    } else if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    }
                }
                sceneRef.current.remove(object);
            }
            // Re-add lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            sceneRef.current.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(0, 10, 5).normalize();
            sceneRef.current.add(directionalLight);
        }

        // Add new object based on type
        if (sceneRef.current) {
            if (type === 'dna') {
                // Simple DNA Helix Visualization
                const material = new THREE.MeshPhongMaterial({ color: 0x007bff, shininess: 80 }); // Blue DNA
                const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x800080, shininess: 80 }); // Purple bases
                const radius = 1;
                const height = 4;
                const numSegments = 30; // Number of turns
                const segmentHeight = height / numSegments;

                for (let i = 0; i <= numSegments; i++) {
                    const angle1 = (i / numSegments) * Math.PI * 8; // 4 full rotations
                    const angle2 = ((i + 0.5) / numSegments) * Math.PI * 8;

                    // Backbone cylinders
                    const cylinderGeometry = new THREE.CylinderGeometry(0.05, 0.05, segmentHeight + 0.1, 8);
                    const cylinder1 = new THREE.Mesh(cylinderGeometry, material);
                    cylinder1.position.set(radius * Math.cos(angle1), radius * Math.sin(angle1), i * segmentHeight - height / 2);
                    sceneRef.current.add(cylinder1);

                    const cylinder2 = new THREE.Mesh(cylinderGeometry, material);
                    cylinder2.position.set(radius * Math.cos(angle1 + Math.PI), radius * Math.sin(angle1 + Math.PI), i * segmentHeight - height / 2);
                    sceneRef.current.add(cylinder2);

                    // Base pairs (connecting cylinders)
                    if (i < numSegments) {
                        const basePairGeometry = new THREE.CylinderGeometry(0.03, 0.03, radius * 2, 8);
                        const basePair = new THREE.Mesh(basePairGeometry, baseMaterial);
                        basePair.position.set(0, 0, (i + 0.5) * segmentHeight - height / 2);
                        basePair.rotation.z = angle1 + Math.PI / 2; // Rotate to connect the two strands
                        sceneRef.current.add(basePair);
                    }
                }

                // Add a simple sphere at the center to represent a nanorobot core
                const coreGeometry = new THREE.SphereGeometry(0.3, 32, 32);
                const coreMaterial = new THREE.MeshPhongMaterial({ color: 0xffa500, shininess: 100 }); // Orange core
                const core = new THREE.Mesh(coreGeometry, coreMaterial);
                core.position.z = -height / 2; // Position at the base of the helix
                sceneRef.current.add(core);

            } else if (type === 'organoid') {
                // Simple Organoid Visualization (layered spheres)
                const coreGeometry = new THREE.SphereGeometry(1.0, 32, 32);
                const coreMaterial = new THREE.MeshPhongMaterial({ color: 0xff6347, transparent: true, opacity: 0.8, shininess: 50 }); // Tomato red core
                const core = new THREE.Mesh(coreGeometry, coreMaterial);
                sceneRef.current.add(core);

                const outerLayerGeometry = new THREE.SphereGeometry(1.2, 32, 32);
                const outerLayerMaterial = new THREE.MeshPhongMaterial({ color: 0x4682b4, transparent: true, opacity: 0.6, shininess: 50 }); // Steel blue outer layer
                const outerLayer = new THREE.Mesh(outerLayerGeometry, outerLayerMaterial);
                sceneRef.current.add(outerLayer);

                const cellsGeometry = new THREE.SphereGeometry(0.1, 16, 16);
                const cellMaterial = new THREE.MeshPhongMaterial({ color: 0x90ee90, shininess: 30 }); // Light green cells

                // Add some "cells" randomly inside
                for (let i = 0; i < 50; i++) {
                    const cell = new THREE.Mesh(cellsGeometry, cellMaterial);
                    const phi = Math.random() * Math.PI * 2;
                    const theta = Math.random() * Math.PI;
                    const r = Math.random() * 0.8; // Max radius within core
                    cell.position.set(
                        r * Math.sin(theta) * Math.cos(phi),
                        r * Math.sin(theta) * Math.sin(phi),
                        r * Math.cos(theta)
                    );
                    sceneRef.current.add(cell);
                }
            }
        }
    }, [type]); // Re-render 3D object when type changes

    return <div ref={mountRef} className="w-full h-96 rounded-md overflow-hidden border border-gray-300 bg-gray-200"></div>;
};

export default App;
