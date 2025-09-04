/**
 * Simple test runner for Americano algorithms
 */

import { runAmericanoTests } from './lib/americano-test';

console.log('🚀 Starting Americano Algorithm Tests\n');

try {
  runAmericanoTests();
  console.log('\n✅ All tests completed successfully!');
} catch (error) {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
}
