/**
 * Test the rollup minified bundle.
 */

import jetSchema from '../dist/index.min.mjs';


// **** ES6 **** //

const schema = jetSchema({
  globals: [],
})

const User = schema({
  id: { vf: () => true, default: 1 },
  name: { vf: () => true, default: 'steve' },
})

console.log(User.new());
