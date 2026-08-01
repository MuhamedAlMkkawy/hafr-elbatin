import { reactive } from 'vue';

const state = reactive({
  events: {}
});

export const bus = {
  emit(event, ...args) {
    if (state.events[event]) {
      state.events[event].forEach(cb => cb(...args));
    }
  },
  on(event, cb) {
    if (!state.events[event]) state.events[event] = [];
    state.events[event].push(cb);
  },
  off(event, cb) {
    if (state.events[event]) {
      state.events[event] = state.events[event].filter(c => c !== cb);
    }
  }
};
