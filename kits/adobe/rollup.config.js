import commonjs from 'rollup-plugin-commonjs';

const { BUILD } = process.env;

const input = {
    server_iife: 'packages/AdobeServer/dist/AdobeServerSideKit.esm.js',
    server_cjs: 'packages/AdobeServer/dist/AdobeServerSideKit.esm.js',
    client_iife: 'packages/AdobeClient/dist/AdobeClientSideKit.esm.js',
    client_cjs: 'packages/AdobeClient/dist/AdobeClientSideKit.esm.js',
    heartbeat_esm: 'HeartbeatKit/src/index.js',
    heartbeat_iife: 'HeartbeatKit/src/index.js'
};

const outputOptions = {
    strict: false
};

const builds = {
    // for dynamic script tag loading of adobe server side kit
    server_iife: {
        output: {
            ...outputOptions,
            name: 'mParticleAdobeServer',
            file: 'packages/AdobeServer/dist/AdobeServerSideKit.iife.js',
            format: 'iife'
        }
    },
    // creates npm module for adobe server side kit
    server_cjs: {
        output: {
            ...outputOptions,
            name: 'mParticleAdobeServer',
            file: 'packages/AdobeServer/dist/AdobeServerSideKit.common.js',
            format: 'cjs'
        }
    },
    // for dynamic script tag loading of adobe client side kit
    client_iife: {
        output: {
            ...outputOptions,
            name: 'mParticleAdobeClient',
            file: 'packages/AdobeClient/dist/AdobeClientSideKit.iife.js',
            format: 'iife'
        }
    },
    // creates npm module for adobe client side kit
    client_cjs: {
        output: {
            ...outputOptions,
            name: 'mParticleAdobeClient',
            file: 'packages/AdobeClient/dist/AdobeClientSideKit.common.js',
            format: 'cjs'
        }
    },
    // creates heartbeat esm module kit that is consumed by adobe client and server kits
    heartbeat_esm: {
        output: {
            ...outputOptions,
            exports: 'named',
            name: 'mpAdobeHBKit',
            file: './HeartbeatKit/dist/AdobeHBKit.esm.js',
            format: 'esm'
        },
        plugins: [commonjs()]
    },
    heartbeat_iife: {
        output: {
            ...outputOptions,
            name: 'mpAdobeHBKit',
            file: './HeartbeatKit/dist/AdobeHBKit.iife.js',
            format: 'iife'
        },
        plugins: [commonjs()]
    }
};

var selectedBuild = {
    input: input[BUILD],
    ...builds[BUILD]
};

export default selectedBuild;
