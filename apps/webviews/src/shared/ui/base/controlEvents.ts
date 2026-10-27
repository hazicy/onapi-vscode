export const eventFor = (value: any, checked: boolean, event: Event) => ({
  target: { value, checked },
  nativeEvent: event,
  stopPropagation: () => event.stopPropagation(),
  preventDefault: () => event.preventDefault(),
});
