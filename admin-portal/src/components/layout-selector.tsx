import React, { useState, useRef, useEffect } from 'react';
import { useSettings } from '@/providers/settings-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Helper hook to detect clicks outside of a component
function useClickOutside(ref: React.RefObject<HTMLElement | null>, callback: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback]);
}

interface LayoutSelectorProps {
  className?: string;
}

const LayoutSelector: React.FC<LayoutSelectorProps> = ({ className }) => {
  const { settings, storeOption } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 }); // Default position near bottom-right
  const [dragState, setDragState] = useState({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  const selectorRef = useRef<HTMLDivElement | null>(null);

  // Close menu when clicking outside
  useClickOutside(selectorRef, () => setIsOpen(false));

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('layout_selector_position');
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
      } catch (e) {
        console.error('Failed to parse layout selector position', e);
      }
    }
  }, []);

  // Recalculate dropdown position when window resizes
  useEffect(() => {
    const handleResize = () => {
      // Trigger a re-render to update dropdownPosition calculation
      setPosition(prev => ({ ...prev }));
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const savePosition = (pos: { x: number; y: number }) => {
    localStorage.setItem('layout_selector_position', JSON.stringify(pos));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectorRef.current) return;

    const rect = selectorRef.current.getBoundingClientRect();
    setDragState({
      isDragging: true,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      initialX: rect.left,
      initialY: rect.top,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState.isDragging || !selectorRef.current) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const selectorWidth = selectorRef.current.offsetWidth;
    const selectorHeight = selectorRef.current.offsetHeight;

    let newX = e.clientX - dragState.startX;
    let newY = e.clientY - dragState.startY;

    // Constrain to viewport
    newX = Math.max(0, Math.min(viewportWidth - selectorWidth, newX));
    newY = Math.max(0, Math.min(viewportHeight - selectorHeight, newY));

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    if (dragState.isDragging) {
      savePosition(position);
      setDragState(prev => ({ ...prev, isDragging: false }));
    }
  };

  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, position]);

  const handleLayoutChange = (layoutName: string) => {
    storeOption('layout', layoutName);
    setIsOpen(false);
  };

  // Determine dropdown position based on available space
  const dropdownPosition = position.y > window.innerHeight / 2 ? 'top' : 'bottom';

  const layoutOptions = [
    { id: 'demo1', name: 'Demo 1' },
    { id: 'demo2', name: 'Demo 2' },
    { id: 'demo3', name: 'Demo 3' },
    { id: 'demo4', name: 'Demo 4' },
    { id: 'demo5', name: 'Demo 5' },
    { id: 'demo6', name: 'Demo 6' },
    { id: 'demo7', name: 'Demo 7' },
    { id: 'demo8', name: 'Demo 8' },
    { id: 'demo9', name: 'Demo 9' },
    { id: 'demo10', name: 'Demo 10' },
  ];

  const currentLayout = settings.layout || 'demo1';

  return (
    <div
      ref={selectorRef}
      className={cn(
        'fixed z-50 w-64 transition-opacity duration-200',
        className
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="relative">
        {/* Draggable area - only around the button, not overlapping it */}
        <div
          className="absolute rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-move"
          onMouseDown={handleMouseDown}
          style={{ 
            top: '0', 
            left: '0', 
            right: '0', 
            bottom: '0',
            margin: '-10px' // Expand the draggable area around the button
          }}
        />
        
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-12 h-12 flex items-center justify-center shadow-lg relative z-10" /* Ensure button is above draggable area */
          aria-label="Layout selector"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-layout-dashboard"
          >
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
          </svg>
        </Button>

        {isOpen && (
          <Card 
            className={`absolute w-full shadow-lg z-50 ${dropdownPosition === 'top' ? 'mb-2' : 'mt-2'}`}
            style={{
              top: dropdownPosition === 'top' ? 'auto' : '100%',
              bottom: dropdownPosition === 'top' ? '100%' : 'auto',
            }}
          >
            <CardHeader>
              <CardTitle className="text-sm">Select Layout</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {layoutOptions.map((layout) => (
                  <Button
                    key={layout.id}
                    variant={currentLayout === layout.id ? 'primary' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => handleLayoutChange(layout.id)}
                  >
                    {layout.name}
                    {currentLayout === layout.id && (
                      <span className="ml-auto text-xs opacity-70">Active</span>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LayoutSelector;