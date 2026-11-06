/* Driftwood Isles: shared imports for the concatenated game scripts. */
import * as THREE_NS from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { CopyShader } from 'three/addons/shaders/CopyShader.js';
import { LuminosityHighPassShader } from 'three/addons/shaders/LuminosityHighPassShader.js';
import { mergeVertices, toCreasedNormals, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const THREE = Object.assign({}, THREE_NS, { EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, OutputPass, GTAOPass, BokehPass, FXAAShader, CopyShader, LuminosityHighPassShader });
const BGU = { mergeVertices, toCreasedNormals, mergeGeometries };
/* Firebase project for online play, from Vercel / .env variables (see SETUP-MULTIPLAYER.md). Empty means solo play. */
const FB_ENV={apiKey:import.meta.env.VITE_FIREBASE_API_KEY||'',authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN||'',databaseURL:import.meta.env.VITE_FIREBASE_DATABASE_URL||'',projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID||'',appId:import.meta.env.VITE_FIREBASE_APP_ID||''};
