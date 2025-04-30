import { useState, useEffect } from 'react';

export interface EventCheckboxes {
  [key: string]: {
    [key: string]: {
      value: boolean;
    }
  }
}

export const useTwoDicesHooks= (eventsName: string[]) => {
  const [eventsCheckboxes, setEventsCheckboxes] = useState<EventCheckboxes>({});

  const buildCheckboxesState = () => {
    const newState: EventCheckboxes = {};
    eventsName.forEach((eventName) => {
      newState[eventName] = {};
      for(let row = 1; row <= 6; row++) {
        for(let col = 1; col <= 6; col++) {
          newState[eventName][`checkbox-${eventName}-${row}-${col}`] = { value: false };
        }
      }
    });
    setEventsCheckboxes(newState);
  };

  const updateEventsCheckboxes = (eventName: string, id: string, checked: boolean) => {
    setEventsCheckboxes(prev => ({
      ...prev,
      [eventName]: {
        ...prev[eventName],
        [id]: {
          value: checked
        }
      }
    }));
  };

  useEffect(() => {
    buildCheckboxesState();
  }, []);

  return {
    eventsCheckboxes,
    updateEventsCheckboxes,
    resetEventsCheckboxes: buildCheckboxesState
  };
};