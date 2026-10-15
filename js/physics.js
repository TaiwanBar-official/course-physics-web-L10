/* =====================================================================
 * physics.js — 物理計算
 * 輸入推力、質量、接觸面，判斷三種狀態並算出摩擦力與加速度。
 * ===================================================================== */
const Physics = {
  /**
   * @param {number} force    推力 (N)
   * @param {number} mass     質量 (kg)
   * @param {object} surface  CONFIG.surfaces 中的一項
   * @returns {{state:string, friction:number, accel:number, maxStatic:number}}
   *   state：'static'（推不動）、'critical'（即將滑動）、'sliding'（滑動）
   */
  compute(force, mass, surface) {
    const normal = mass * CONFIG.g;
    const maxStatic = round1(surface.muS * normal);
    const kinetic = round1(maxStatic * CONFIG.kineticRatio);
    const EPS = 1e-6;

    if (force < maxStatic - EPS) {
      return { state: 'static', friction: force, accel: 0, maxStatic };
    }
    if (Math.abs(force - maxStatic) <= EPS) {
      return { state: 'critical', friction: maxStatic, accel: 0, maxStatic };
    }
    return { state: 'sliding', friction: kinetic, accel: (force - kinetic) / mass, maxStatic };
  },
};

function round1(n) {
  return Math.round(n * 10) / 10;
}
