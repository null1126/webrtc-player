const pad2 = (n: number) => String(n).padStart(2, '0');

export const formatTime = (date: Date): string => {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
};

let _id = 0;
export const nextId = (): number => {
  return ++_id;
};

export const getSourceName = (source: { type: string }): string => {
  if (source.type === 'screen') return '屏幕录制';
  if (source.type === 'camera') return '摄像头';
  return String(source.type);
};
