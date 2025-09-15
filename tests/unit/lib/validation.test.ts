import { generateOrderId } from '@/lib/utils/validation';

describe('Validation Utils', () => {
  describe('generateOrderId', () => {
    it('should generate a valid order ID', () => {
      const orderId = generateOrderId();
      expect(orderId).toBeDefined();
      expect(typeof orderId).toBe('string');
      expect(orderId.length).toBeGreaterThan(0);
    });

    it('should generate unique order IDs', () => {
      const id1 = generateOrderId();
      const id2 = generateOrderId();
      expect(id1).not.toBe(id2);
    });
  });
});