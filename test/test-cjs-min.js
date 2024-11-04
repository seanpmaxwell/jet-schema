/**
 * Test the rollup minified bundle.
 */

const jetSchema = require('../dist/index.min.js').default;


// **** CommonJS **** //

const schema = jetSchema({
  globals: [],
})

const UserCjs = schema({
  id: { vf: () => true, default: 1 },
  name: { vf: () => true, default: 'steve' },
})

console.log(UserCjs.new());
