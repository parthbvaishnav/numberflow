import { generateLevel } from '../src/utils/levelGenerator';

describe('Level Generator Optimization', () => {
  it('should generate a level successfully for level 1 (5x5 grid)', () => {
    const level = generateLevel(1);
    expect(level).toBeDefined();
    expect(level.size).toBe(5);
    expect(level.nodes.length).toBeGreaterThan(0);
    expect(level.solution.length).toBe(25);
  });

  it('should generate a level successfully for level 5 (6x6 grid)', () => {
    const level = generateLevel(5);
    expect(level).toBeDefined();
    expect(level.size).toBe(6);
    expect(level.nodes.length).toBeGreaterThan(0);
    expect(level.solution.length).toBe(36);
  });

  it('should generate levels 1 to 20 without failing/blocking', () => {
    for (let i = 1; i <= 20; i++) {
      const level = generateLevel(i);
      expect(level).toBeDefined();
      expect(level.solution.length).toBe(level.size * level.size);
    }
  });
});
