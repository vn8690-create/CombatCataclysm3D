// BokenSystem drives save-friendly exploration nodes separately from real-time battle logic.
const NODE_TYPES = new Set(['story', 'encounter', 'recruit', 'battle', 'boss', 'reward', 'hidden']);

export class BokenSystem {
  constructor(routes = [], saveState = null) {
    this.routes = new Map();
    for (const route of routes) this.registerRoute(route);

    const firstRoute = routes[0] || null;
    this.currentRouteId = saveState?.currentRouteId || firstRoute?.id || null;
    this.currentNodeId = saveState?.currentNodeId || firstRoute?.startNodeId || null;
    this.visitedNodes = new Set(saveState?.visitedNodes || []);
    this.resolvedNodes = new Set(saveState?.resolvedNodes || []);
    this.completedRoutes = new Set(saveState?.completedRoutes || []);
    this.recruitedCharacters = new Set(saveState?.recruitedCharacters || []);
    this.flags = { ...(saveState?.flags || {}) };
  }

  validateRoute(route) {
    const errors = [];
    if (!route?.id) errors.push('Missing route id.');
    if (!route?.regionId) errors.push('Missing regionId.');
    if (!route?.startNodeId) errors.push('Missing startNodeId.');
    if (!Array.isArray(route?.nodes) || route.nodes.length === 0) errors.push('Route needs nodes.');
    if (errors.length) return errors;

    const ids = new Set();
    for (const node of route.nodes) {
      if (!node?.id) errors.push('Node missing id.');
      if (!NODE_TYPES.has(node?.type)) errors.push(`Invalid node type for ${node?.id || 'unknown'}.`);
      if (ids.has(node?.id)) errors.push(`Duplicate node id: ${node.id}.`);
      ids.add(node?.id);
      if (!Array.isArray(node?.next)) errors.push(`Node ${node?.id || 'unknown'} requires next array.`);
    }
    if (!ids.has(route.startNodeId)) errors.push('startNodeId does not exist.');
    for (const node of route.nodes) {
      for (const nextId of node.next || []) {
        if (!ids.has(nextId)) errors.push(`Node ${node.id} points to missing node ${nextId}.`);
      }
    }
    return errors;
  }

  registerRoute(route) {
    const errors = this.validateRoute(route);
    if (errors.length) throw new Error(`Invalid Boken route: ${errors.join(' ')}`);
    if (this.routes.has(route.id)) throw new Error(`Duplicate route id: ${route.id}`);
    const nodeMap = Object.freeze(Object.fromEntries(route.nodes.map(node => [node.id, node])));
    this.routes.set(route.id, Object.freeze({ ...route, nodeMap }));
  }

  getRoute(id = this.currentRouteId) {
    return this.routes.get(id) || null;
  }

  getCurrentNode() {
    const route = this.getRoute();
    return route?.nodeMap[this.currentNodeId] || null;
  }

  startRoute(routeId) {
    const route = this.getRoute(routeId);
    if (!route) return false;
    this.currentRouteId = route.id;
    this.currentNodeId = route.startNodeId;
    this.visitedNodes.add(this.currentNodeId);
    return true;
  }

  availableNextNodes() {
    const route = this.getRoute();
    const node = this.getCurrentNode();
    if (!route || !node) return [];
    return node.next.map(id => route.nodeMap[id]).filter(Boolean);
  }

  moveTo(nodeId) {
    const allowed = this.availableNextNodes().some(node => node.id === nodeId);
    if (!allowed) return false;
    this.currentNodeId = nodeId;
    this.visitedNodes.add(nodeId);
    return true;
  }

  resolveCurrentNode(result = {}) {
    const node = this.getCurrentNode();
    if (!node) return { ok: false, reason: 'missing-node' };

    if ((node.type === 'battle' || node.type === 'boss') && result.win !== true) {
      return { ok: false, reason: 'battle-not-won', node };
    }

    if (node.type === 'recruit' && node.rewardCharacterId) {
      this.recruitedCharacters.add(node.rewardCharacterId);
    }

    if (result.flags && typeof result.flags === 'object') {
      Object.assign(this.flags, result.flags);
    }

    this.resolvedNodes.add(node.id);
    if (node.next.length === 0) this.completedRoutes.add(this.currentRouteId);
    return {
      ok: true,
      node,
      next: this.availableNextNodes(),
      routeCompleted: this.completedRoutes.has(this.currentRouteId),
    };
  }

  serialize() {
    return {
      currentRouteId: this.currentRouteId,
      currentNodeId: this.currentNodeId,
      visitedNodes: [...this.visitedNodes],
      resolvedNodes: [...this.resolvedNodes],
      completedRoutes: [...this.completedRoutes],
      recruitedCharacters: [...this.recruitedCharacters],
      flags: { ...this.flags },
    };
  }
}

BokenSystem.NODE_TYPES = NODE_TYPES;
