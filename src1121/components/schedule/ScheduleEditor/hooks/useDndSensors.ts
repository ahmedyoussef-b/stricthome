import { useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';

export const useDndSensors = () => {
  return useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor)
  );
};