const logicSystem = (() => {
    'use strict';
    let THREE, sceneRef, levelDataRef, domRef, mainRaycasterRef, mainCameraRef, orbitControlsRef;
    let showStatusFn, captureStateFn, requestRenderFn, onNodeSelectedFn, populateBuildMenuFn, getSnapStateFn, getEditorConstantFn, setOrbitControlsEnabledFn;

    const NODE_SIZE = 0.8, NODE_HEIGHT = 0.15, TERMINAL_RADIUS = 0.08, TERMINAL_HEIGHT = 0.1, TERMINAL_OFFSET_Y = 0.01, TERMINAL_SPACING = 0.25;
    const WIRE_COLOR = 0x00ffff, WIRE_HIGHLIGHT_COLOR = 0xffff00, WIRE_OPACITY = 0.7;
    const TEXT_SIZE = 0.08, TEXT_HEIGHT = 0.01; // TEXT_SIZE, TEXT_HEIGHT currently unused by canvas text

    let logicNodesGroup, logicWiresGroup;
    let nodeMaterialCache = {};
    let terminalGeo, inputMat, outputMat, wireMat, wireHighlightMat;
    let isInitialized = false, isVisible = false, isWiring = false, isDraggingNode = false;
    let wiringState = { startNodeData: null, startTerminalMesh: null, tempWire: null };
    let selectedNodesData = [], selectedNodeMeshes = [];
    let placingNodeType = null;
    let groundPlane;

    const LOGIC_NODE_DEFINITIONS = {
        CONSTANT_SIGNAL: { displayName: "Constant", color: 0xffaa00, terminals: { inputs: [], outputs: [{ key: 'out', name: 'Value', type: 'signal', side: 'right', index: 0 }] }, defaultProperties: { value: true }, propertySchema: [{ key: 'value', label: 'Output Value', type: 'boolean' }] },
        TOGGLE_SWITCH: { displayName: "Toggle Switch", color: 0x00aaff, terminals: { inputs: [], outputs: [{ key: 'state', name: 'State', type: 'signal', side: 'right', index: 0 }] }, defaultProperties: { initialState: false }, propertySchema: [{ key: 'initialState', label: 'Initial State (ON)', type: 'boolean' }] },
        PULSE: { displayName: "Pulse", color: 0xff00ff, terminals: { inputs: [{ key: 'trigger', name: 'Trigger', type: 'signal', side: 'left', index: 0 }], outputs: [{ key: 'pulse', name: 'Pulse', type: 'signal', side: 'right', index: 0 }] }, defaultProperties: { pulseDuration: 1.0 }, propertySchema: [{ key: 'pulseDuration', label: 'Pulse Duration (s)', type: 'number', min: 0.1, step: 0.1 }] },
        AREA_TRIGGER: { displayName: "Area Trigger", color: 0x00ffaa, terminals: { inputs: [], outputs: [{ key: 'onEnter', name: 'On Enter', type: 'signal', side: 'right', index: 0 }, { key: 'onExit', name: 'On Exit', type: 'signal', side: 'right', index: 1 }, { key: 'isOverlapping', name: 'Is Overlapping', type: 'signal', side: 'right', index: 2 }] }, defaultProperties: { triggerShape: 'box', dimensions: [2, 2, 2], radius: 1, entityFilter: 'PlayerOnly', filterTag: '' }, propertySchema: [{ key: 'triggerShape', label: 'Shape', type: 'select', options: ['box', 'sphere'] }, { key: 'dimensions', label: 'Dimensions (X,Y,Z)', type: 'vector3', if: 'triggerShape=="box"' }, { key: 'radius', label: 'Radius', type: 'number', min: 0.1, step: 0.1, if: 'triggerShape=="sphere"' }, { key: 'entityFilter', label: 'Filter', type: 'select', options: ['PlayerOnly', 'AnyEntity', 'SpecificTag'] }, { key: 'filterTag', label: 'Tag', type: 'string', if: 'entityFilter=="SpecificTag"' }] },
        OBJECT_STATE_CHANGE: { displayName: "Object State Change", color: 0xaaff00, terminals: { inputs: [], outputs: [{ key: 'onChange', name: 'On Change', type: 'signal', side: 'right', index: 0 }] }, defaultProperties: { targetObjectId: '', propertyToWatch: 'isVisible' }, propertySchema: [{ key: 'targetObjectId', label: 'Target Object ID', type: 'object_id' }, { key: 'propertyToWatch', label: 'Property to Watch', type: 'string' }] },
        NOT_GATE: { displayName: "NOT", color: 0xcccccc, terminals: { inputs: [{ key: 'in', name: 'In', type: 'signal', side: 'left', index: 0 }], outputs: [{ key: 'out', name: 'Out', type: 'signal', side: 'right', index: 0 }] }, defaultProperties: {}, propertySchema: [] },
        DELAY: { displayName: "Delay", color: 0xcccc00, terminals: { inputs: [{ key: 'in', name: 'In', type: 'signal', side: 'left', index: 0 }], outputs: [{ key: 'out', name: 'Out', type: 'signal', side: 'right', index: 0 }] }, defaultProperties: { delayDuration: 1.0 }, propertySchema: [{ key: 'delayDuration', label: 'Delay (s)', type: 'number', min: 0.0, step: 0.1 }] },
        COMPARATOR: { displayName: "Comparator", color: 0xcc00cc, terminals: { inputs: [{ key: 'a', name: 'A', type: 'number', side: 'left', index: 0 }, { key: 'b', name: 'B', type: 'number', side: 'left', index: 1 }], outputs: [{ key: 'out', name: 'Result', type: 'number', side: 'right', index: 0 }] }, defaultProperties: { mode: 'CompareGreater' }, propertySchema: [{ key: 'mode', label: 'Mode', type: 'select', options: ['CompareGreater', 'CompareLess', 'CompareEqual', 'Subtract'] }] },
        MOVE_OBJECT: { displayName: "Move Object", color: 0x00cccc, terminals: { inputs: [{ key: 'trigger', name: 'Trigger', type: 'signal', side: 'left', index: 0 }, { key: 'targetObj', name: 'Target Obj', type: 'object', side: 'left', index: 1 }], outputs: [{ key: 'onComplete', name: 'On Complete', type: 'signal', side: 'right', index: 0 }] }, defaultProperties: { targetObjectId: '', movementVector: [0, 1, 0], speed: 1.0, movementType: 'smooth', returnOnSignalOff: false }, propertySchema: [{ key: 'targetObjectId', label: 'Target Object ID', type: 'object_id' }, { key: 'movementVector', label: 'Movement (X,Y,Z)', type: 'vector3' }, { key: 'speed', label: 'Speed/Duration', type: 'number', min: 0.1, step: 0.1 }, { key: 'movementType', label: 'Type', type: 'select', options: ['instant', 'smooth'] }, { key: 'returnOnSignalOff', label: 'Return on Signal OFF', type: 'boolean' }] },
        TOGGLE_OBJECT_STATE: { displayName: "Toggle Object State", color: 0xccaa00, terminals: { inputs: [{ key: 'trigger', name: 'Trigger', type: 'signal', side: 'left', index: 0 }, { key: 'targetObj', name: 'Target Obj', type: 'object', side: 'left', index: 1 }], outputs: [] }, defaultProperties: { targetObjectId: '', propertyToSetOn: 'isVisible', valueOn: 'true', propertyToSetOff: 'isVisible', valueOff: 'false', isToggle: true }, propertySchema: [{ key: 'targetObjectId', label: 'Target Object ID', type: 'object_id' }, { key: 'isToggle', label: 'Toggle Mode?', type: 'boolean' }, { key: 'propertyToSetOn', label: 'Property', type: 'string', if: '!isToggle' }, { key: 'valueOn', label: 'Value (ON)', type: 'string', if: '!isToggle' }, { key: 'propertyToSetOff', label: 'Property (OFF)', type: 'string', if: '!isToggle' }, { key: 'valueOff', label: 'Value (OFF)', type: 'string', if: '!isToggle' }, { key: 'propertyToToggle', label: 'Property to Toggle', type: 'string', if: 'isToggle' }] },
        TOGGLE_LIGHT: { displayName: "Toggle Light", color: 0xffff88, terminals: { inputs: [{ key: 'trigger', name: 'Trigger', type: 'signal', side: 'left', index: 0 }, { key: 'targetLight', name: 'Target Light', type: 'object', side: 'left', index: 1 }], outputs: [] }, defaultProperties: { targetLightId: '', onIntensity: 1.0, offIntensity: 0.0, onColor: '#ffffff', offColor: '#ffffff', transitionDuration: 0.2 }, propertySchema: [{ key: 'targetLightId', label: 'Target Light ID', type: 'object_id' }, { key: 'onIntensity', label: 'ON Intensity', type: 'number', min: 0, step: 0.1 }, { key: 'onColor', label: 'ON Color', type: 'color'}, { key: 'offIntensity', label: 'OFF Intensity', type: 'number', min: 0, step: 0.1 }, { key: 'offColor', label: 'OFF Color', type: 'color'}, { key: 'transitionDuration', label: 'Transition (s)', type: 'number', min: 0, step: 0.05 }] },
        SPAWN_ENTITY: { displayName: "Spawn Entity", color: 0x88ffff, terminals: { inputs: [{ key: 'trigger', name: 'Trigger', type: 'signal', side: 'left', index: 0 }], outputs: [{ key: 'spawnedEntity', name: 'Spawned', type: 'object', side: 'right', index: 0 }] }, defaultProperties: { entityPrefab: '', spawnPointOffset: [0, 0, 0], parentToSpawner: false }, propertySchema: [{ key: 'entityPrefab', label: 'Entity Prefab Name', type: 'string' }, { key: 'spawnPointOffset', label: 'Spawn Offset (X,Y,Z)', type: 'vector3' }, { key: 'parentToSpawner', label: 'Parent to This Node?', type: 'boolean'}] },
        PLAY_SOUND: { displayName: "Play Sound", color: 0xff88ff, terminals: { inputs: [{ key: 'trigger', name: 'Trigger', type: 'signal', side: 'left', index: 0 }], outputs: [] }, defaultProperties: { soundAsset: '', volume: 1.0, loop: false, attachedNodeId: null }, propertySchema: [{ key: 'soundAsset', label: 'Sound Asset Name', type: 'string' }, { key: 'volume', label: 'Volume', type: 'number', min: 0, max: 1, step: 0.05 }, { key: 'loop', label: 'Loop', type: 'boolean' }, { key: 'attachedNodeId', label: 'Attach to Node ID (3D)', type: 'object_id' }] },
        SET_PATH_SPEED: { displayName: "Set Path Speed", color: 0x44aa88, terminals: { inputs: [{key:'trigger', name:'Trigger', type:'signal', side:'left', index:0}, {key:'target', name:'Target', type:'object', side:'left', index:1}], outputs: []}, defaultProperties: { targetEntityId: '', speedMultiplier: 1.0}, propertySchema: [{key:'targetEntityId', label:'Target Path Follower ID', type:'object_id'}, {key:'speedMultiplier', label:'Speed Multiplier', type:'number', min:0, step:0.1}] },
        TRIGGER_PATH_ACTION: { displayName: "Path Action", color: 0x44aa88, terminals: { inputs: [{key:'trigger', name:'Trigger', type:'signal', side:'left', index:0}, {key:'target', name:'Target', type:'object', side:'left', index:1}], outputs: []}, defaultProperties: { targetEntityId: '', action: 'Stop'}, propertySchema: [{key:'targetEntityId', label:'Target Path Follower ID', type:'object_id'}, {key:'action', label:'Action', type:'select', options:['Stop', 'Play', 'Reverse', 'EjectRider', 'PlayAnimation']}] },
        PATH_SENSOR: { displayName: "Path Sensor", color: 0x44ccaa, terminals: { inputs: [], outputs: [{key:'onEnter', name:'On Enter', type:'signal', side:'right', index:0}, {key:'onExit', name:'On Exit', type:'signal', side:'right', index:1}]}, defaultProperties: { pathToMonitorId: '', pathSectionIndex: 0}, propertySchema: [{key:'pathToMonitorId', label:'Path Object ID', type:'object_id'}, {key:'pathSectionIndex', label:'Path Section Index', type:'number', min:0, step:1}] },
        AND_GATE: { displayName: "AND", color: 0xaaaaaa, terminals: { inputs: [{ key: 'in1', name: 'A', type: 'signal', side: 'left', index: 0 }, { key: 'in2', name: 'B', type: 'signal', side: 'left', index: 1 }], outputs: [{ key: 'out', name: 'Out', type: 'signal', side: 'right', index: 0 }] }, defaultProperties: {}, propertySchema: [] },
        OR_GATE: { displayName: "OR", color: 0xaaaaaa, terminals: { inputs: [{ key: 'in1', name: 'A', type: 'signal', side: 'left', index: 0 }, { key: 'in2', name: 'B', type: 'signal', side: 'left', index: 1 }], outputs: [{ key: 'out', name: 'Out', type: 'signal', side: 'right', index: 0 }] }, defaultProperties: {}, propertySchema: [] },
        XOR_GATE: { displayName: "XOR", color: 0xaaaaaa, terminals: { inputs: [{ key: 'in1', name: 'A', type: 'signal', side: 'left', index: 0 }, { key: 'in2', name: 'B', type: 'signal', side: 'left', index: 1 }], outputs: [{ key: 'out', name: 'Out', type: 'signal', side: 'right', index: 0 }] }, defaultProperties: {}, propertySchema: [] },
        FLIP_FLOP: { displayName: "Flip-Flop (T)", color: 0xa0a0ff, terminals: { inputs: [{ key: 'toggle', name: 'Toggle', type: 'signal', side: 'left', index: 0 }, { key: 'reset', name: 'Reset', type: 'signal', side: 'left', index: 1 }], outputs: [{ key: 'q', name: 'Q', type: 'signal', side: 'right', index: 0 }] }, defaultProperties: { initialState: false }, propertySchema: [{ key: 'initialState', label: 'Initial State (Q)', type: 'boolean' }] },
        COUNTER: { displayName: "Counter", color: 0xffa0a0, terminals: { inputs: [{ key: 'pulse', name: 'Pulse In', type: 'signal', side: 'left', index: 0 }, { key: 'reset', name: 'Reset', type: 'signal', side: 'left', index: 1 }], outputs: [{ key: 'onTarget', name: 'On Target', type: 'signal', side: 'right', index: 0 }, { key: 'count', name: 'Count Val', type: 'number', side: 'right', index: 1 }] }, defaultProperties: { targetCount: 5, resetOnTarget: true }, propertySchema: [{ key: 'targetCount', label: 'Target Count', type: 'number', min: 1, step: 1 }, { key: 'resetOnTarget', label: 'Reset on Target', type: 'boolean' }] },
        RANDOM_BRANCH: { displayName: "Random Branch", color: 0xa0ffa0, terminals: { inputs: [{ key: 'trigger', name: 'Trigger', type: 'signal', side: 'left', index: 0 }], outputs: [{ key: 'out1', name: 'Out 1', type: 'signal', side: 'right', index: 0 }, { key: 'out2', name: 'Out 2', type: 'signal', side: 'right', index: 1 }, { key: 'out3', name: 'Out 3', type: 'signal', side: 'right', index: 2 }] }, defaultProperties: { numOutputs: 2, weights: "1,1" }, propertySchema: [{ key: 'numOutputs', label: '# Outputs (2-3)', type: 'number', min: 2, max: 3, step: 1 }, { key: 'weights', label: 'Weights (CSV)', type: 'string' }] },
        SEQUENCE: { displayName: "Sequence", color: 0xffa0ff, terminals: { inputs: [{ key: 'trigger', name: 'Trigger', type: 'signal', side: 'left', index: 0 }], outputs: [{ key: 'out1', name: 'Out 1', type: 'signal', side: 'right', index: 0 }, { key: 'out2', name: 'Out 2', type: 'signal', side: 'right', index: 1 }, { key: 'out3', name: 'Out 3', type: 'signal', side: 'right', index: 2 }] }, defaultProperties: { delays: "0.5,0.5" }, propertySchema: [{ key: 'delays', label: 'Delays (CSV, sec)', type: 'string' }] },
        BRANCH: { displayName: "Branch (If)", color: 0x8888ff, terminals: { inputs: [{ key: 'condition', name: 'Condition', type: 'signal', side: 'left', index: 0 }, { key: 'in', name: 'Exec In', type: 'signal', side: 'left', index: 1 }], outputs: [{ key: 'truePath', name: 'True', type: 'signal', side: 'right', index: 0 }, { key: 'falsePath', name: 'False', type: 'signal', side: 'right', index: 1 }] }, defaultProperties: {}, propertySchema: [] },
        GET_GAME_VARIABLE: { displayName: "Get Var", color: 0xccffcc, terminals: { inputs: [], outputs: [{ key: 'value', name: 'Value', type: 'any', side: 'right', index: 0 }] }, defaultProperties: { variableName: 'myVariable' }, propertySchema: [{ key: 'variableName', label: 'Variable Name', type: 'string' }] },
        SET_GAME_VARIABLE: { displayName: "Set Var", color: 0xccccff, terminals: { inputs: [{ key: 'trigger', name: 'Trigger', type: 'signal', side: 'left', index: 0 }, { key: 'valueIn', name: 'Value In', type: 'any', side: 'left', index: 1 }], outputs: [] }, defaultProperties: { variableName: 'myVariable' }, propertySchema: [{ key: 'variableName', label: 'Variable Name', type: 'string' }] },
        DEBUG_LOG: { displayName: "Debug Log", color: 0x808080, terminals: { inputs: [{ key: 'message', name: 'Value/Msg', type: 'any', side: 'left', index: 0 }], outputs: [] }, defaultProperties: { prefix: 'LOG:' }, propertySchema: [{ key: 'prefix', label: 'Log Prefix', type: 'string' }] },
        CUSTOM_EVENT_SENDER: { displayName: "Send Event", color: 0xffcc88, terminals: { inputs: [{ key: 'trigger', name: 'Trigger', type: 'signal', side: 'left', index: 0 }], outputs: [] }, defaultProperties: { eventName: 'myCustomEvent' }, propertySchema: [{ key: 'eventName', label: 'Event Name', type: 'string' }] },
        CUSTOM_EVENT_LISTENER: { displayName: "Listen Event", color: 0x88ccff, terminals: { inputs: [], outputs: [{ key: 'onEvent', name: 'On Event', type: 'signal', side: 'right', index: 0 }] }, defaultProperties: { eventName: 'myCustomEvent' }, propertySchema: [{ key: 'eventName', label: 'Event Name', type: 'string' }] },
    };

    function _getNodeMaterial(color) {
        const hexColor = color || 0x555555;
        if (!nodeMaterialCache[hexColor]) {
            nodeMaterialCache[hexColor] = new THREE.MeshStandardMaterial({ color: hexColor, roughness: 0.7, metalness: 0.2 });
        }
        return nodeMaterialCache[hexColor];
    }

    function _createNodeMesh(nodeData) {
        const definition = LOGIC_NODE_DEFINITIONS[nodeData.nodeType];
        if (!definition) return null;
        const group = new THREE.Group();
        group.position.fromArray(nodeData.position);
        const nodeGeo = new THREE.BoxGeometry(NODE_SIZE, NODE_HEIGHT, NODE_SIZE * 0.6);
        const nodeMat = _getNodeMaterial(definition.color);
        const body = new THREE.Mesh(nodeGeo, nodeMat);
        body.castShadow = false; body.receiveShadow = false;
        group.add(body);
        const terminals = [];
        const allTerminals = [...(definition.terminals.inputs || []), ...(definition.terminals.outputs || [])];
        const inputCount = definition.terminals.inputs?.length || 0;
        const outputCount = definition.terminals.outputs?.length || 0;
        allTerminals.forEach(termDef => {
            const isInput = termDef.side === 'left';
            const termMat = isInput ? inputMat : outputMat;
            const terminalMesh = new THREE.Mesh(terminalGeo, termMat);
            const xPos = (isInput ? -1 : 1) * (NODE_SIZE / 2);
            const yPos = (NODE_HEIGHT / 2 - TERMINAL_HEIGHT / 2 - TERMINAL_OFFSET_Y) - termDef.index * TERMINAL_SPACING;
            terminalMesh.position.set(xPos, yPos, 0);
            terminalMesh.rotation.z = Math.PI / 2;
            terminalMesh.userData = { isLogicTerminal: true, nodeId: nodeData.id, terminalKey: termDef.key, terminalType: termDef.side === 'left' ? 'input' : 'output', dataType: termDef.type || 'any' };
            group.add(terminalMesh);
            terminals.push(terminalMesh);
        });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128; canvas.height = 32;
        context.fillStyle = '#ffffff'; context.font = '16px Arial';
        context.textAlign = 'center'; context.textBaseline = 'middle';
        context.fillText(definition.displayName, canvas.width / 2, canvas.height / 2);
        const textTexture = new THREE.CanvasTexture(canvas);
        textTexture.needsUpdate = true;
        const textMat = new THREE.MeshBasicMaterial({ map: textTexture, transparent: true, depthWrite: false, side:THREE.DoubleSide });
        const textGeo = new THREE.PlaneGeometry(NODE_SIZE * 0.8, NODE_HEIGHT * 0.8);
        const textMesh = new THREE.Mesh(textGeo, textMat);
        textMesh.position.y = NODE_HEIGHT / 2 + 0.01; textMesh.rotation.x = -Math.PI / 2;
        group.add(textMesh);
        group.userData = { dataId: nodeData.id, isLogicNode: true, nodeType: nodeData.nodeType, nodeName: definition.displayName, terminals: terminals };
        nodeData.position = group.position.toArray();
        return group;
    }

    function _createWireMesh(wireData, nodesGroup) {
        const fromNodeMesh = nodesGroup.children.find(m => m.userData.dataId === wireData.fromNodeId);
        const toNodeMesh = nodesGroup.children.find(m => m.userData.dataId === wireData.toNodeId);
        if (!fromNodeMesh || !toNodeMesh) return null;
        const startTerminal = fromNodeMesh.userData.terminals?.find(t => t.userData.terminalKey === wireData.fromTerminalKey);
        const endTerminal = toNodeMesh.userData.terminals?.find(t => t.userData.terminalKey === wireData.toTerminalKey);
        if (!startTerminal || !endTerminal) return null;
        const startPos = startTerminal.getWorldPosition(new THREE.Vector3());
        const endPos = endTerminal.getWorldPosition(new THREE.Vector3());
        const geometry = new THREE.BufferGeometry().setFromPoints([startPos, endPos]);
        const wire = new THREE.Line(geometry, wireMat);
        wire.userData = { isLogicWire: true, dataId: wireData.id, fromNodeId: wireData.fromNodeId, fromTerminalKey: wireData.fromTerminalKey, toNodeId: wireData.toNodeId, toTerminalKey: wireData.toTerminalKey };
        wire.frustumCulled = false;
        return wire;
    }

     function _updateAllWireMeshes() {
        if (!logicNodesGroup || !logicWiresGroup || !levelDataRef?.logicSystem?.wires) return;
        const wiresToRemove = [];
        logicWiresGroup.children.forEach(wireMesh => {
            const wireData = levelDataRef.logicSystem.wires.find(w => w.id === wireMesh.userData.dataId);
            if (!wireData) { wiresToRemove.push(wireMesh); return; }
            const fromNodeMesh = logicNodesGroup.children.find(m => m.userData.dataId === wireData.fromNodeId);
            const toNodeMesh = logicNodesGroup.children.find(m => m.userData.dataId === wireData.toNodeId);
            if (!fromNodeMesh || !toNodeMesh) { wiresToRemove.push(wireMesh); return; }
            const startTerminal = fromNodeMesh.userData.terminals?.find(t => t.userData.terminalKey === wireData.fromTerminalKey);
            const endTerminal = toNodeMesh.userData.terminals?.find(t => t.userData.terminalKey === wireData.toTerminalKey);
            if (!startTerminal || !endTerminal) { wiresToRemove.push(wireMesh); return; }
            const positions = wireMesh.geometry.attributes.position;
            const startPos = startTerminal.getWorldPosition(new THREE.Vector3());
            const endPos = endTerminal.getWorldPosition(new THREE.Vector3());
            positions.setXYZ(0, startPos.x, startPos.y, startPos.z);
            positions.setXYZ(1, endPos.x, endPos.y, endPos.z);
            positions.needsUpdate = true;
            wireMesh.geometry.computeBoundingSphere();
        });
        wiresToRemove.forEach(wireMesh => {
            wireMesh.geometry.dispose();
            logicWiresGroup.remove(wireMesh);
        });
    }

    function _clearSelection() {
        selectedNodesData = []; selectedNodeMeshes = [];
        onNodeSelectedFn?.(null);
        requestRenderFn();
    }

    function _selectNode(nodeMesh, nodeData, multiSelect = false) {
        if (!nodeMesh || !nodeData) return;
        const alreadySelected = selectedNodeMeshes.includes(nodeMesh);
        if (multiSelect) {
            if (alreadySelected) {
                selectedNodesData = selectedNodesData.filter(d => d.id !== nodeData.id);
                selectedNodeMeshes = selectedNodeMeshes.filter(m => m !== nodeMesh);
            } else {
                selectedNodesData.push(nodeData);
                selectedNodeMeshes.push(nodeMesh);
            }
        } else {
            if (alreadySelected && selectedNodesData.length === 1) return;
            _clearSelection();
            selectedNodesData = [nodeData];
            selectedNodeMeshes = [nodeMesh];
        }
        onNodeSelectedFn?.(selectedNodesData.length === 1 ? selectedNodesData[0] : null);
        requestRenderFn();
    }

    function _startWiring(startTerminalMesh) {
        if (!startTerminalMesh?.userData.isLogicTerminal) return;
        const startNodeMesh = startTerminalMesh.parent;
        const startNodeData = levelDataRef?.logicSystem?.nodes.find(n => n.id === startNodeMesh?.userData?.dataId);
        if (!startNodeMesh || !startNodeData) return;
        isWiring = true;
        setOrbitControlsEnabledFn?.(false);
        wiringState.startNodeData = startNodeData;
        wiringState.startTerminalMesh = startTerminalMesh;
        const startPos = startTerminalMesh.getWorldPosition(new THREE.Vector3());
        const geometry = new THREE.BufferGeometry().setFromPoints([startPos, startPos]);
        wiringState.tempWire = new THREE.Line(geometry, wireHighlightMat);
        wiringState.tempWire.frustumCulled = false;
        logicWiresGroup.add(wiringState.tempWire);
        showStatusFn("Wiring: Drag to target terminal, Right-click/Esc to cancel");
        requestRenderFn();
    }

     function _updateWiring(raycaster) {
         if (!isWiring || !wiringState.tempWire) return;
         let targetPoint = null;
         const logicIntersects = raycaster.intersectObjects(logicNodesGroup.children, true);
         if (logicIntersects.length > 0) {
             const firstHit = logicIntersects[0].object;
             if (firstHit.userData.isLogicTerminal && firstHit.userData.nodeId !== wiringState.startNodeData.id) {
                 const endTerminalType = firstHit.userData.terminalType;
                 const startTerminalType = wiringState.startTerminalMesh.userData.terminalType;
                 if (endTerminalType !== startTerminalType) {
                     const startDataType = wiringState.startTerminalMesh.userData.dataType || 'any';
                     const endDataType = firstHit.userData.dataType || 'any';
                     if (startDataType === 'any' || endDataType === 'any' || startDataType === endDataType) {
                         targetPoint = firstHit.getWorldPosition(new THREE.Vector3());
                     }
                 }
             }
         }
         if (!targetPoint) {
             targetPoint = new THREE.Vector3();
             raycaster.ray.intersectPlane(groundPlane, targetPoint);
         }
         if (targetPoint) {
             const positions = wiringState.tempWire.geometry.attributes.position;
             const startPos = wiringState.startTerminalMesh.getWorldPosition(new THREE.Vector3());
             positions.setXYZ(0, startPos.x, startPos.y, startPos.z);
             positions.setXYZ(1, targetPoint.x, targetPoint.y, targetPoint.z);
             positions.needsUpdate = true;
             wiringState.tempWire.geometry.computeBoundingSphere();
         }
         requestRenderFn();
     }

    function _completeWiring(raycaster) {
        if (!isWiring || !wiringState.tempWire) { _cancelWiring(); return; }
        let connectionMade = false;
        const logicIntersects = raycaster.intersectObjects(logicNodesGroup.children, true);
        if (logicIntersects.length > 0) {
            const endTerminalMesh = logicIntersects[0].object;
            if (endTerminalMesh.userData.isLogicTerminal && endTerminalMesh.userData.nodeId !== wiringState.startNodeData.id && endTerminalMesh.userData.terminalType !== wiringState.startTerminalMesh.userData.terminalType) {
                 const startDataType = wiringState.startTerminalMesh.userData.dataType || 'any';
                 const endDataType = endTerminalMesh.userData.dataType || 'any';
                 if(startDataType === 'any' || endDataType === 'any' || startDataType === endDataType) {
                    const endNodeMesh = endTerminalMesh.parent;
                    const endNodeData = levelDataRef?.logicSystem?.nodes.find(n => n.id === endNodeMesh?.userData?.dataId);
                    const endTerminalKey = endTerminalMesh.userData.terminalKey;
                    const startTerminalKey = wiringState.startTerminalMesh.userData.terminalKey;
                    if (endNodeData) {
                        const startIsOutput = wiringState.startTerminalMesh.userData.terminalType === 'output';
                        const fromNodeId = startIsOutput ? wiringState.startNodeData.id : endNodeData.id;
                        const fromKey = startIsOutput ? startTerminalKey : endTerminalKey;
                        const toNodeId = startIsOutput ? endNodeData.id : wiringState.startNodeData.id;
                        const toKey = startIsOutput ? endTerminalKey : startTerminalKey;
                        const existingWireToInput = levelDataRef.logicSystem.wires.find(w => w.toNodeId === toNodeId && w.toTerminalKey === toKey);
                        if (!existingWireToInput) {
                            const wireData = { id: THREE.MathUtils.generateUUID(), fromNodeId: fromNodeId, fromTerminalKey: fromKey, toNodeId: toNodeId, toTerminalKey: toKey };
                            levelDataRef.logicSystem.wires.push(wireData);
                            const wireMesh = _createWireMesh(wireData, logicNodesGroup);
                            if (wireMesh) {
                                logicWiresGroup.add(wireMesh);
                                showStatusFn(`Wire connected: ${wireData.fromTerminalKey} to ${wireData.toTerminalKey}`);
                                captureStateFn?.("Add Logic Wire");
                                connectionMade = true;
                            } else {
                                levelDataRef.logicSystem.wires = levelDataRef.logicSystem.wires.filter(w => w.id !== wireData.id);
                                showStatusFn("Error creating wire mesh.", 3000);
                            }
                        } else { showStatusFn("Input terminal already connected.", 3000); }
                    }
                 } else { showStatusFn("Incompatible data types.", 3000); }
            }
        }
        if (!connectionMade) showStatusFn("Wiring cancelled - no valid target.", 2000);
        _cancelWiring();
    }

    function _cancelWiring() {
        if (isWiring) {
            isWiring = false;
            setOrbitControlsEnabledFn?.(true);
            if (wiringState.tempWire) {
                logicWiresGroup.remove(wiringState.tempWire);
                wiringState.tempWire.geometry.dispose();
                wiringState.tempWire = null;
            }
            wiringState = { startNodeData: null, startTerminalMesh: null, tempWire: null };
            requestRenderFn();
        }
    }

    function init(options) {
        if (isInitialized) return;
        THREE = options.THREE; sceneRef = options.scene; levelDataRef = options.levelData; domRef = options.dom;
        mainRaycasterRef = options.raycaster; mainCameraRef = options.camera; orbitControlsRef = options.orbitControls;
        showStatusFn = options.showStatus; captureStateFn = options.captureState; requestRenderFn = options.requestRender;
        onNodeSelectedFn = options.onNodeSelected; populateBuildMenuFn = options.populateBuildMenuCallback;
        getSnapStateFn = options.getSnapState; getEditorConstantFn = options.getEditorConstant;
        setOrbitControlsEnabledFn = options.setOrbitControlsEnabled;

        if (!THREE || !sceneRef || !levelDataRef || !showStatusFn || !captureStateFn || !requestRenderFn || !onNodeSelectedFn || !populateBuildMenuFn || !getSnapStateFn || !getEditorConstantFn || !setOrbitControlsEnabledFn || !mainRaycasterRef || !mainCameraRef || !orbitControlsRef) {
            console.error("LogicSystem: Missing required options during initialization!");
            return;
        }
        groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        levelDataRef.logicSystem = levelDataRef.logicSystem || {};
        levelDataRef.logicSystem.nodes = levelDataRef.logicSystem.nodes || [];
        levelDataRef.logicSystem.wires = levelDataRef.logicSystem.wires || [];
        logicNodesGroup = new THREE.Group(); logicNodesGroup.name = "LogicNodesGroup"; logicNodesGroup.visible = isVisible; sceneRef.add(logicNodesGroup);
        logicWiresGroup = new THREE.Group(); logicWiresGroup.name = "LogicWiresGroup"; logicWiresGroup.visible = isVisible; sceneRef.add(logicWiresGroup);
        terminalGeo = new THREE.CylinderGeometry(TERMINAL_RADIUS, TERMINAL_RADIUS, TERMINAL_HEIGHT, 12);
        inputMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6, metalness: 0.2 });
        outputMat = new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x003366, roughness: 0.4, metalness: 0.3 });
        wireMat = new THREE.LineBasicMaterial({ color: WIRE_COLOR, linewidth: 2, transparent: true, opacity: WIRE_OPACITY });
        wireHighlightMat = new THREE.LineBasicMaterial({ color: WIRE_HIGHLIGHT_COLOR, linewidth: 3 });
        populateBuildMenuFn?.(LOGIC_NODE_DEFINITIONS);
        isInitialized = true;
        console.log("Logic System Initialized");
    }

    function toggleVisibility(show) {
        if (!isInitialized) return;
        isVisible = !!show;
        logicNodesGroup.visible = isVisible; logicWiresGroup.visible = isVisible;
        if (!isVisible) { _cancelWiring(); setPlacingNodeType(null); _clearSelection(); }
        requestRenderFn();
    }

    function setPlacingNodeType(type) {
         if (placingNodeType === type) return;
         placingNodeType = type;
         if (type) {
              _clearSelection();
              showStatusFn(`Placing ${LOGIC_NODE_DEFINITIONS[type]?.displayName || 'Unknown Node'}. Click on ground.`);
         } else { showStatusFn("Exited node placement mode."); }
    }

    function handlePointerDown(event, mouseCoords) {
        if (!isVisible || !isInitialized) return false;
        mainRaycasterRef.setFromCamera(mouseCoords, mainCameraRef);
        if (placingNodeType) {
            const intersectPoint = new THREE.Vector3();
            if (mainRaycasterRef.ray.intersectPlane(groundPlane, intersectPoint)) {
                let placePos = intersectPoint.toArray();
                if (getSnapStateFn?.()) {
                    const snap = getEditorConstantFn?.('SNAP_TRANSLATION') || 1.0;
                    placePos[0] = Math.round(placePos[0] / snap) * snap;
                    placePos[2] = Math.round(placePos[2] / snap) * snap;
                }
                placePos[1] = NODE_HEIGHT / 2;
                addNode(placingNodeType, placePos);
            }
            return true;
        }
        const intersects = mainRaycasterRef.intersectObjects(logicNodesGroup.children, true);
        let clickedOnLogic = false;
        if (intersects.length > 0) {
            let hitObject = intersects[0].object;
            if (hitObject.userData.isLogicTerminal) {
                 _startWiring(hitObject);
                 clickedOnLogic = true;
            } else {
                 while(hitObject && !hitObject.userData.isLogicNode && hitObject !== logicNodesGroup) hitObject = hitObject.parent;
                 if (hitObject?.userData.isLogicNode) {
                     const nodeData = levelDataRef?.logicSystem?.nodes.find(n => n.id === hitObject.userData.dataId);
                     if (nodeData) {
                         _selectNode(hitObject, nodeData, event.shiftKey || event.ctrlKey);
                         isDraggingNode = true;
                         setOrbitControlsEnabledFn?.(false);
                         clickedOnLogic = true;
                     }
                 }
            }
        }
        if (!clickedOnLogic && !(event.shiftKey || event.ctrlKey)) _clearSelection();
        if (isWiring && event.button === 2) { _cancelWiring(); clickedOnLogic = true; }
        return clickedOnLogic;
    }

    function handlePointerMove(event, mouseCoords) {
         if (!isVisible || !isInitialized) return false;
         mainRaycasterRef.setFromCamera(mouseCoords, mainCameraRef);
        if (isWiring) { _updateWiring(mainRaycasterRef); return true; }
        if (isDraggingNode && selectedNodeMeshes.length === 1) {
             const intersectPoint = new THREE.Vector3();
             if (mainRaycasterRef.ray.intersectPlane(groundPlane, intersectPoint)) {
                  let newPos = intersectPoint;
                  if (getSnapStateFn?.()) {
                       const snap = getEditorConstantFn?.('SNAP_TRANSLATION') || 1.0;
                       newPos.x = Math.round(newPos.x / snap) * snap;
                       newPos.z = Math.round(newPos.z / snap) * snap;
                  }
                  newPos.y = NODE_HEIGHT / 2;
                  selectedNodeMeshes[0].position.copy(newPos);
                  if (selectedNodesData[0]) selectedNodesData[0].position = newPos.toArray();
                  _updateAllWireMeshes();
                  requestRenderFn();
             }
             return true;
        }
         return false;
    }

    function handlePointerUp(event, mouseCoords) {
        if (!isVisible || !isInitialized) return false;
        let eventHandled = false;
        if (isWiring) {
             mainRaycasterRef.setFromCamera(mouseCoords, mainCameraRef);
             _completeWiring(mainRaycasterRef);
             eventHandled = true;
        }
        if (isDraggingNode) {
             isDraggingNode = false;
             setOrbitControlsEnabledFn?.(true);
             if (selectedNodesData.length > 0) captureStateFn?.("Move Logic Node");
             eventHandled = true;
        }
        return eventHandled;
    }

    function handleKeyDown(event) {
         if (!isVisible || !isInitialized) return false;
         const key = event.key.toLowerCase();
         if (key === 'escape') {
              if (isWiring) { _cancelWiring(); return true; }
              if (placingNodeType) { setPlacingNodeType(null); return true; }
              if (selectedNodesData.length > 0) { _clearSelection(); return true; }
         }
         if ((key === 'delete' || key === 'backspace') && selectedNodesData.length > 0) { deleteSelectedNodes(); return true; }
         if ((event.ctrlKey || event.metaKey) && key === 'd' && selectedNodesData.length > 0) { cloneSelectedNodes(); return true; }
         return false;
    }

    function addNode(nodeType, positionArray) {
        const definition = LOGIC_NODE_DEFINITIONS[nodeType];
        if (!definition || !levelDataRef?.logicSystem) return null;
        const newNodeData = { id: THREE.MathUtils.generateUUID(), nodeType: nodeType, position: positionArray || [0, NODE_HEIGHT / 2, 0], properties: deepClone(definition.defaultProperties || {}) };
        levelDataRef.logicSystem.nodes.push(newNodeData);
        const nodeMesh = _createNodeMesh(newNodeData);
        if (!nodeMesh) {
            levelDataRef.logicSystem.nodes = levelDataRef.logicSystem.nodes.filter(n => n.id !== newNodeData.id);
            showStatusFn(`Failed to create mesh for ${definition.displayName}`, 3000);
            return null;
        }
        logicNodesGroup.add(nodeMesh);
        captureStateFn?.(`Add Logic Node: ${definition.displayName}`);
        showStatusFn(`Added ${definition.displayName}`);
        requestRenderFn();
        _selectNode(nodeMesh, newNodeData, false);
        return newNodeData;
    }

    function deleteSelectedNodes() {
         if (selectedNodesData.length === 0 || !levelDataRef?.logicSystem) return;
         captureStateFn?.("Delete Logic Node(s)");
         const idsToDelete = new Set(selectedNodesData.map(d => d.id));
         const meshesToRemove = [...selectedNodeMeshes];
         levelDataRef.logicSystem.nodes = levelDataRef.logicSystem.nodes.filter(n => !idsToDelete.has(n.id));
         levelDataRef.logicSystem.wires = levelDataRef.logicSystem.wires.filter(w => !idsToDelete.has(w.fromNodeId) && !idsToDelete.has(w.toNodeId));
         meshesToRemove.forEach(mesh => {
              mesh.traverse(child => {
                   if (child !== mesh && !child.userData.isLogicTerminal) {
                        child.geometry?.dispose();
                        if(child.material) { child.material.dispose(); child.material.map?.dispose(); }
                   }
              });
              logicNodesGroup.remove(mesh);
         });
         _clearSelection();
         _updateAllWireMeshes();
         showStatusFn(`Deleted ${idsToDelete.size} logic node(s).`);
         requestRenderFn();
    }

    function cloneSelectedNodes() { // Assumes deepClone is available in scope
         if (selectedNodesData.length === 0 || !levelDataRef?.logicSystem) return;
         captureStateFn?.("Clone Logic Node(s)");
         const clonedNodesData = []; const newMeshes = [];
         const offset = getEditorConstantFn?.('SNAP_TRANSLATION') || 1.0;
         selectedNodesData.forEach(originalData => {
             const clonedData = { id: THREE.MathUtils.generateUUID(), nodeType: originalData.nodeType, position: [originalData.position[0] + offset, originalData.position[1], originalData.position[2] + offset], properties: deepClone(originalData.properties || {}) };
             levelDataRef.logicSystem.nodes.push(clonedData);
             const nodeMesh = _createNodeMesh(clonedData);
             if(nodeMesh) { logicNodesGroup.add(nodeMesh); clonedNodesData.push(clonedData); newMeshes.push(nodeMesh); }
             else { levelDataRef.logicSystem.nodes = levelDataRef.logicSystem.nodes.filter(n => n.id !== clonedData.id); }
         });
         if(newMeshes.length > 0) {
             _clearSelection();
             selectedNodesData = clonedNodesData; selectedNodeMeshes = newMeshes;
             onNodeSelectedFn?.(selectedNodesData.length === 1 ? selectedNodesData[0] : null);
             showStatusFn(`Cloned ${newMeshes.length} node(s).`);
             requestRenderFn();
         }
    }

    function rebuildVisuals(logicSystemData) {
        if (!isInitialized || !logicSystemData) return;
        while (logicNodesGroup.children.length > 0) {
            const mesh = logicNodesGroup.children[0];
             mesh.traverse(child => { if (child !== mesh && !child.userData.isLogicTerminal) { child.geometry?.dispose(); if(child.material) { child.material.dispose(); child.material.map?.dispose(); } } });
            logicNodesGroup.remove(mesh);
        }
        while (logicWiresGroup.children.length > 0) {
            const wire = logicWiresGroup.children[0];
            wire.geometry.dispose();
            logicWiresGroup.remove(wire);
        }
        _clearSelection();
        if (logicSystemData.nodes) logicSystemData.nodes.forEach(nodeData => { const nodeMesh = _createNodeMesh(nodeData); if (nodeMesh) logicNodesGroup.add(nodeMesh); });
        if (logicSystemData.wires) logicSystemData.wires.forEach(wireData => { const wireMesh = _createWireMesh(wireData, logicNodesGroup); if (wireMesh) logicWiresGroup.add(wireMesh); });
        requestRenderFn();
    }

     function buildNodePropertiesUI(nodeData, containerElement, updateCallback) {
         if (!nodeData || !containerElement || !updateCallback) return;
         const definition = LOGIC_NODE_DEFINITIONS[nodeData.nodeType];
         if (!definition?.propertySchema) return;
         containerElement.innerHTML = '';
         definition.propertySchema.forEach(propDef => {
             if (propDef.if) { try { if (!new Function('props', `return ${propDef.if}`)(nodeData.properties)) return; } catch (e) { console.error(`Error evaluating 'if' for ${propDef.key}: ${e}`); return; } }
             const propId = `logicProp_${nodeData.id}_${propDef.key}`;
             const currentValue = nodeData.properties[propDef.key];
             const label = document.createElement('label');
             label.htmlFor = propId; label.textContent = propDef.label || propDef.key;
             containerElement.appendChild(label);
             let inputElement;
             switch (propDef.type) {
                 case 'boolean':
                     inputElement = document.createElement('input'); inputElement.type = 'checkbox'; inputElement.checked = !!currentValue;
                     inputElement.addEventListener('change', (e) => updateCallback(propDef.key, e.target.checked));
                     label.insertBefore(inputElement, label.firstChild); label.htmlFor = '';
                     break;
                 case 'number':
                     inputElement = document.createElement('input'); inputElement.type = 'number'; inputElement.value = currentValue !== undefined ? currentValue : (propDef.min ?? 0);
                     if (propDef.min !== undefined) inputElement.min = propDef.min; if (propDef.max !== undefined) inputElement.max = propDef.max; inputElement.step = propDef.step || 'any';
                     inputElement.addEventListener('change', (e) => updateCallback(propDef.key, parseFloat(e.target.value)));
                     inputElement.addEventListener('input', (e) => nodeData.properties[propDef.key] = parseFloat(e.target.value));
                     containerElement.appendChild(inputElement);
                     break;
                 case 'string': case 'object_id':
                     inputElement = document.createElement('input'); inputElement.type = 'text'; inputElement.value = currentValue || ''; inputElement.placeholder = propDef.type === 'object_id' ? 'Object ID...' : '';
                     inputElement.addEventListener('change', (e) => updateCallback(propDef.key, e.target.value));
                     inputElement.addEventListener('input', (e) => nodeData.properties[propDef.key] = e.target.value);
                     containerElement.appendChild(inputElement);
                     break;
                 case 'vector3':
                     const group = document.createElement('div'); group.className = 'coord-input-group';
                     const currentVec = Array.isArray(currentValue) && currentValue.length === 3 ? currentValue : [0,0,0];
                     ['X', 'Y', 'Z'].forEach((axis, index) => {
                         const span = document.createElement('span'); span.className = 'coord-label'; span.textContent = axis;
                         const vecInput = document.createElement('input'); vecInput.type = 'number'; vecInput.step = propDef.step || 0.1; vecInput.className = 'coord-input'; vecInput.value = currentVec[index].toFixed(2); vecInput.dataset.axisIndex = index; vecInput.id = `${propId}_${axis.toLowerCase()}`;
                         const updateVector = () => { nodeData.properties[propDef.key] = [parseFloat(group.querySelector('[data-axis-index="0"]').value) || 0, parseFloat(group.querySelector('[data-axis-index="1"]').value) || 0, parseFloat(group.querySelector('[data-axis-index="2"]').value) || 0]; };
                         vecInput.addEventListener('change', () => { updateVector(); updateCallback(propDef.key, nodeData.properties[propDef.key]); });
                         vecInput.addEventListener('input', updateVector);
                         group.appendChild(span); group.appendChild(vecInput);
                     });
                     containerElement.appendChild(group);
                     break;
                 case 'select':
                     inputElement = document.createElement('select');
                     (propDef.options || []).forEach(opt => {
                         const option = document.createElement('option'); option.value = typeof opt === 'object' ? opt.value : opt; option.textContent = typeof opt === 'object' ? opt.label : opt; option.selected = option.value == currentValue;
                         inputElement.appendChild(option);
                     });
                     inputElement.addEventListener('change', (e) => updateCallback(propDef.key, e.target.value));
                     containerElement.appendChild(inputElement);
                     break;
                  case 'color':
                      inputElement = document.createElement('input'); inputElement.type = 'color'; inputElement.value = currentValue || '#ffffff';
                      inputElement.addEventListener('change', (e) => updateCallback(propDef.key, e.target.value));
                      inputElement.addEventListener('input', (e) => nodeData.properties[propDef.key] = e.target.value);
                      containerElement.appendChild(inputElement);
                      break;
                 default: const span = document.createElement('span'); span.textContent = `Unsupported type: ${propDef.type}`; containerElement.appendChild(span);
             }
             if (inputElement) inputElement.id = propId;
         });
     }

     function getNodeDefinition(nodeType) { return LOGIC_NODE_DEFINITIONS[nodeType]; }
     function getAllNodeDefinitions() { return LOGIC_NODE_DEFINITIONS; }
     function updateNodePosition(nodeId, newPositionArray) {
          if (!levelDataRef?.logicSystem?.nodes) return;
          const nodeData = levelDataRef.logicSystem.nodes.find(n => n.id === nodeId);
          if(nodeData) {
              nodeData.position = newPositionArray;
              const nodeMesh = logicNodesGroup.children.find(m => m.userData.dataId === nodeId);
              if (nodeMesh) { nodeMesh.position.fromArray(newPositionArray); _updateAllWireMeshes(); }
          }
     }

    return { init, toggleVisibility, handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown, setPlacingNodeType, rebuildVisuals, buildNodePropertiesUI, updateNodePosition, getNodeDefinition, getAllNodeDefinitions };
})();