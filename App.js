import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// --- Main App Component ---
// This is the root component that orchestrates the entire application.
// It manages the global state for DNA elements, CRISPR input/results,
// loading states, and the current 3D viewer type.

const App = () => {
    // State for managing the list of DNA elements added to the construct.
    // Each element has an ID, type (e.g., 'Gene', 'Promoter'), and a name.
    const [dnaElements, setDnaElements] = useState([]);
    // State for the DNA sequence input by the user for CRISPR analysis.
    const [crisprInputSequence, setCrisprInputSequence] = useState('');
    // State to store the results returned from the CRISPR analysis (AI model).
    const [crisprResults, setCrisprResults] = useState('');
    // State to indicate if the CRISPR analysis is currently in progress.
    const [isLoadingCrispr, setIsLoadingCrispr] = useState(false);
    // State to control which 3D visualization is currently active ('dna' or 'organoid').
    const [viewerType, setViewerType] = useState('dna');

    // Function to add a new DNA element to the `dnaElements` array.
    // It creates a unique ID using Date.now() and assigns a default name.
    const addDnaElement = (type) => {
        setDnaElements([...dnaElements, { id: Date.now(), type, name: `${type} ${dnaElements.length + 1}` }]);
    };

    // Function to remove a DNA element from the `dnaElements` array based on its ID.
    const removeDnaElement = (id) => {
        setDnaElements(dnaElements.filter(el => el.id !== id));
    };

    // Asynchronous function to perform CRISPR analysis using the Gemini API.
    // This demonstrates interaction with an external AI model.
    const analyzeCrispr = async () => {
        // Basic validation: check if the input sequence is empty.
        if (!crisprInputSequence.trim()) {
            setCrisprResults('Please enter a DNA sequence to analyze.');
            return;
        }

        setIsLoadingCrispr(true); // Set loading state to true.
        setCrisprResults('Analyzing sequence...'); // Provide immediate feedback to the user.

        try {
            // Construct the prompt for the AI model.
            // This prompt instructs the AI to identify PAM sites, suggest gRNAs, and predict off-targets.
            const prompt = `Given the following DNA sequence, identify all "NGG" PAM sites and suggest potential gRNA sequences (20 nucleotides immediately preceding the NGG PAM site, on the 5' to 3' strand). Also, predict any potential off-target sites if the sequence is very short or repetitive, assuming a simple search for similar sequences.

DNA Sequence:
${crisprInputSequence}

Format your response clearly, listing PAM sites and corresponding gRNAs.`;

            // Prepare the chat history payload for the Gemini API.
            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });
            const payload = { contents: chatHistory };
            const apiKey = ""; // API key is provided by the Canvas runtime environment.
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            // Make the API call to the Gemini model.
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Handle non-OK HTTP responses from the API.
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API error: ${response.status} - ${errorData.error.message}`);
            }

            // Parse the JSON response from the API.
            const result = await response.json();

            // Extract the text content from the AI's response.
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                setCrisprResults(text); // Update state with the AI's results.
            } else {
                setCrisprResults('No valid response from AI. Please try again.'); // Handle empty or malformed responses.
            }
        } catch (error) {
            console.error('Error analyzing CRISPR:', error); // Log detailed error to console.
            setCrisprResults(`Error: ${error.message}. Could not analyze sequence.`); // Display user-friendly error.
        } finally {
            setIsLoadingCrispr(false); // Always reset loading state.
        }
    };

    // Placeholder function for exporting design data.
    // In a real application, this would trigger file downloads.
    const exportData = (format) => {
        let dataToExport = '';
        // Construct mock data based on the selected format.
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
        console.log(`Exporting as ${format}:\n`, dataToExport); // Log data to console for inspection.
        alert(`Exporting as ${format}. Check console for data or imagine a download!`); // User feedback.
    };

    return (
        // Main container for the entire application, using Tailwind CSS for layout and styling.
        // min-h-screen: Ensures the container takes at least the full viewport height.
        // bg-gray-100: Light gray background.
        // font-sans antialiased text-gray-800: Sets font family, smoothing, and default text color.
        // p-4: Adds padding around the entire app.
        // flex flex-col: Arranges children vertically.
        <div className="min-h-screen bg-gray-100 font-sans antialiased text-gray-800 p-4 flex flex-col">
            {/* Header Section */}
            <header className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-lg shadow-lg mb-6">
                <h1 className="text-4xl font-extrabold text-center tracking-tight">BioSynth Designer</h1>
                <p className="text-xl text-center mt-2 opacity-90">Design DNA Nanorobots & Organoids</p>
            </header>

            {/* Main Content Area - Layout for left and right panels */}
            {/* flex-col lg:flex-row: Stacks vertically on small screens, horizontally on large screens. */}
            {/* flex-grow: Allows this section to take up available vertical space. */}
            {/* gap-6: Adds space between the left and right panels. */}
            <div className="flex flex-col lg:flex-row flex-grow gap-6">
                {/* Left Panel: Contains DNA Editor and CRISPR Tool */}
                <div className="flex flex-col w-full lg:w-1/2 gap-6">
                    {/* DNA Editor Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md flex-grow">
                        <h2 className="text-2xl font-semibold text-blue-700 mb-4">DNA Editor</h2>
                        <p className="text-gray-600 mb-4">Add and arrange genetic elements for your design.</p>
                        {/* Buttons for adding DNA elements */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                            {/* Each button uses Tailwind for styling: background, text color, padding, rounded corners, shadow, hover effects. */}
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
                        {/* Display area for current DNA construct elements */}
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

                    {/* CRISPR Targeting Tool Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md flex-grow">
                        <h2 className="text-2xl font-semibold text-blue-700 mb-4">CRISPR Targeting</h2>
                        <p className="text-gray-600 mb-4">Enter a DNA sequence to find PAM sites and design gRNAs.</p>
                        {/* Textarea for DNA sequence input */}
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mb-4 resize-y min-h-[100px]"
                            placeholder="Enter DNA sequence (e.g., ATGCATGCATGC...)"
                            value={crisprInputSequence}
                            onChange={(e) => setCrisprInputSequence(e.target.value)}
                        ></textarea>
                        {/* Analyze button */}
                        <button
                            onClick={analyzeCrispr}
                            disabled={isLoadingCrispr} // Button is disabled when analysis is in progress.
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md shadow-md transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoadingCrispr ? 'Analyzing...' : 'Analyze Sequence'}
                        </button>
                        {/* Display area for CRISPR results */}
                        <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded-md min-h-[100px] overflow-y-auto whitespace-pre-wrap text-sm text-gray-700">
                            {crisprResults || 'Results will appear here.'}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Contains 3D Viewer and Export Tools */}
                <div className="flex flex-col w-full lg:w-1/2 gap-6">
                    {/* 3D Viewer Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md flex-grow">
                        <h2 className="text-2xl font-semibold text-blue-700 mb-4">3D Viewer</h2>
                        <p className="text-gray-600 mb-4">Visualize your DNA nanostructures or organoids.</p>
                        {/* Buttons to switch between DNA and Organoid views */}
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
                        {/* The ThreeDViewer component is rendered here, passing the current viewerType as a prop. */}
                        <ThreeDViewer type={viewerType} />
                    </div>

                    {/* Export Tools Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-blue-700 mb-4">Export Tools</h2>
                        <p className="text-gray-600 mb-4">Save your design in various formats.</p>
                        {/* Buttons for various export formats */}
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

// --- ThreeDViewer Component ---
// This component encapsulates all the logic for the 3D visualization using Three.js.
// It receives a 'type' prop to determine which model to display.
const ThreeDViewer = ({ type }) => {
    // useRef hooks to get direct access to DOM elements and Three.js objects.
    const mountRef = useRef(null); // Reference to the DOM element where the Three.js canvas will be mounted.
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const animationFrameIdRef = useRef(null); // To store the ID for requestAnimationFrame for cleanup.

    // useCallback memoizes the animate function to prevent unnecessary re-creations,
    // which is important for useEffect dependencies.
    const animate = useCallback(() => {
        // Render the scene with the camera.
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
        // Request the next animation frame, creating a continuous loop.
        animationFrameIdRef.current = requestAnimationFrame(animate);
    }, []); // Empty dependency array means this function is created only once.

    // useEffect hook for setting up and tearing down the Three.js scene.
    // This runs once on component mount and cleans up on unmount.
    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return; // Exit if the mount point is not available.

        // --- Three.js Scene Setup ---
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = new THREE.Color(0xf0f0f0); // Set a light gray background color.

        // Camera setup: PerspectiveCamera with field of view, aspect ratio, near and far clipping planes.
        const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        cameraRef.current = camera;
        camera.position.z = 5; // Position the camera back from the origin.

        // Renderer setup: WebGLRenderer for rendering 3D graphics.
        const renderer = new THREE.WebGLRenderer({ antialias: true }); // antialias for smoother edges.
        rendererRef.current = renderer;
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight); // Set renderer size to container size.
        renderer.setPixelRatio(window.devicePixelRatio); // Adjust for high-DPI screens.
        currentMount.appendChild(renderer.domElement); // Add the renderer's canvas to the DOM.

        // OrbitControls setup: Allows interactive camera control (rotate, pan, zoom).
        const controls = new OrbitControls(camera, renderer.domElement);
        controlsRef.current = controls;
        controls.enableDamping = true; // Enables smooth camera movement.
        controls.dampingFactor = 0.25;
        controls.screenSpacePanning = false; // Prevents panning in screen space.
        controls.maxPolarAngle = Math.PI / 2; // Restricts vertical rotation to prevent going "underground".

        // Lighting: Essential for seeing 3D objects.
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Soft, general light from all directions.
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Light from a specific direction.
        directionalLight.position.set(0, 10, 5).normalize(); // Position and normalize for consistent intensity.
        scene.add(directionalLight);

        // Handle window resize events to make the 3D canvas responsive.
        const onWindowResize = () => {
            if (currentMount && cameraRef.current && rendererRef.current) {
                cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight; // Update aspect ratio.
                cameraRef.current.updateProjectionMatrix(); // Recalculate projection matrix.
                rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight); // Resize renderer.
            }
        };
        window.addEventListener('resize', onWindowResize); // Attach event listener.

        // Start the animation loop.
        animate();

        // Cleanup function for useEffect. This runs when the component unmounts.
        return () => {
            cancelAnimationFrame(animationFrameIdRef.current); // Stop the animation loop.
            window.removeEventListener('resize', onWindowResize); // Remove resize listener.
            if (currentMount && renderer.domElement) {
                currentMount.removeChild(renderer.domElement); // Remove canvas from DOM.
            }
            renderer.dispose(); // Dispose of the WebGL renderer's resources.
            controls.dispose(); // Dispose of OrbitControls resources.
            // Dispose of all Three.js objects in the scene to prevent memory leaks.
            scene.traverse((object) => {
                if (object.isMesh) {
                    object.geometry.dispose(); // Dispose of geometry.
                    if (object.material.isMaterial) {
                        object.material.dispose(); // Dispose of material (single).
                    } else if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose()); // Dispose of materials (array).
                    }
                }
            });
        };
    }, [animate]); // Dependency array: `animate` is included because it's a `useCallback` dependency.

    // useEffect hook to update the 3D model when the `type` prop changes.
    useEffect(() => {
        // Clear all previous objects from the scene before adding new ones.
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
            // Re-add lighting after clearing the scene, as lights were also removed.
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            sceneRef.current.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(0, 10, 5).normalize();
            sceneRef.current.add(directionalLight);
        }

        // Add new 3D object based on the `type` prop.
        if (sceneRef.current) {
            if (type === 'dna') {
                // --- Simple DNA Helix Visualization ---
                // Materials for the DNA backbone and base pairs.
                const material = new THREE.MeshPhongMaterial({ color: 0x007bff, shininess: 80 }); // Blue for backbone.
                const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x800080, shininess: 80 }); // Purple for bases.
                const radius = 1; // Radius of the helix.
                const height = 4; // Total height of the helix.
                const numSegments = 30; // Number of segments (turns) in the helix.
                const segmentHeight = height / numSegments; // Height of each segment.

                // Loop to create the helix structure.
                for (let i = 0; i <= numSegments; i++) {
                    const angle1 = (i / numSegments) * Math.PI * 8; // Angle for one strand (4 full rotations).
                    // Position for the first backbone cylinder.
                    const cylinderGeometry = new THREE.CylinderGeometry(0.05, 0.05, segmentHeight + 0.1, 8);
                    const cylinder1 = new THREE.Mesh(cylinderGeometry, material);
                    cylinder1.position.set(radius * Math.cos(angle1), radius * Math.sin(angle1), i * segmentHeight - height / 2);
                    sceneRef.current.add(cylinder1);

                    // Position for the second backbone cylinder (opposite side of the helix).
                    const cylinder2 = new THREE.Mesh(cylinderGeometry, material);
                    cylinder2.position.set(radius * Math.cos(angle1 + Math.PI), radius * Math.sin(angle1 + Math.PI), i * segmentHeight - height / 2);
                    sceneRef.current.add(cylinder2);

                    // Base pairs (connecting cylinders between strands).
                    if (i < numSegments) {
                        const basePairGeometry = new THREE.CylinderGeometry(0.03, 0.03, radius * 2, 8);
                        const basePair = new THREE.Mesh(basePairGeometry, baseMaterial);
                        basePair.position.set(0, 0, (i + 0.5) * segmentHeight - height / 2);
                        basePair.rotation.z = angle1 + Math.PI / 2; // Rotate to correctly connect the strands.
                        sceneRef.current.add(basePair);
                    }
                }

                // Add a simple sphere to represent a nanorobot core at the base of the helix.
                const coreGeometry = new THREE.SphereGeometry(0.3, 32, 32);
                const coreMaterial = new THREE.MeshPhongMaterial({ color: 0xffa500, shininess: 100 }); // Orange core.
                const core = new THREE.Mesh(coreGeometry, coreMaterial);
                core.position.z = -height / 2;
                sceneRef.current.add(core);

            } else if (type === 'organoid') {
                // --- Simple Organoid Visualization (layered spheres) ---
                // Core layer of the organoid.
                const coreGeometry = new THREE.SphereGeometry(1.0, 32, 32);
                const coreMaterial = new THREE.MeshPhongMaterial({ color: 0xff6347, transparent: true, opacity: 0.8, shininess: 50 }); // Tomato red, semi-transparent.
                const core = new THREE.Mesh(coreGeometry, coreMaterial);
                sceneRef.current.add(core);

                // Outer layer of the organoid.
                const outerLayerGeometry = new THREE.SphereGeometry(1.2, 32, 32);
                const outerLayerMaterial = new THREE.MeshPhongMaterial({ color: 0x4682b4, transparent: true, opacity: 0.6, shininess: 50 }); // Steel blue, more transparent.
                const outerLayer = new THREE.Mesh(outerLayerGeometry, outerLayerMaterial);
                sceneRef.current.add(outerLayer);

                // Small spheres representing individual cells within the organoid.
                const cellsGeometry = new THREE.SphereGeometry(0.1, 16, 16);
                const cellMaterial = new THREE.MeshPhongMaterial({ color: 0x90ee90, shininess: 30 }); // Light green cells.

                // Add 50 random "cells" inside the organoid.
                for (let i = 0; i < 50; i++) {
                    const cell = new THREE.Mesh(cellsGeometry, cellMaterial);
                    // Random spherical coordinates for cell placement.
                    const phi = Math.random() * Math.PI * 2;
                    const theta = Math.random() * Math.PI;
                    const r = Math.random() * 0.8; // Random radius within the core for distribution.
                    cell.position.set(
                        r * Math.sin(theta) * Math.cos(phi),
                        r * Math.sin(theta) * Math.sin(phi),
                        r * Math.cos(theta)
                    );
                    sceneRef.current.add(cell);
                }
            }
        }
    }, [type]); // Dependency array: This effect re-runs whenever the `type` prop changes.

    // The component's render method returns a div that serves as the mount point for the Three.js canvas.
    // Tailwind CSS classes are used for styling this container.
    return <div ref={mountRef} className="w-full h-96 rounded-md overflow-hidden border border-gray-300 bg-gray-200"></div>;
};

export default App;
