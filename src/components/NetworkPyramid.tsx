import React, { useState, useRef, useEffect } from 'react';
import { Phone, RotateCcw, ZoomIn, ZoomOut, ChevronDown, ChevronRight } from 'lucide-react';

export interface PyramidNodeData {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  avatar?: string;
  badge?: string;
  level?: number;
  children?: PyramidNodeData[];
}

interface NetworkPyramidProps {
  root: PyramidNodeData;
  darkMode?: boolean;
  onNodeClick?: (node: PyramidNodeData) => void;
  primaryColor?: string;
}

interface PyramidNodeProps {
  node: PyramidNodeData;
  level: number;
  darkMode: boolean;
  primaryColor: string;
  onNodeClick?: (node: PyramidNodeData) => void;
  parentName?: string;
  isExpanded: boolean;
  onToggle: (nodeId: number | string) => void;
  expandedNodes: Set<number | string>;
}

interface Transform2D {
  scale: number;
  translateX: number;
  translateY: number;
}

const getColorByLevel = (level: number, primaryColor: string): string => {
  const colors = [
    primaryColor,
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ec4899', // pink
  ];
  return colors[level % colors.length];
};

const PyramidNodeComponent: React.FC<PyramidNodeProps> = ({
  node,
  level,
  darkMode,
  primaryColor,
  onNodeClick,
  parentName,
  isExpanded,
  onToggle,
  expandedNodes,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const nodeColor = getColorByLevel(level, primaryColor);
  const initials = node.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleCardClick = () => {
    if (hasChildren) {
      onToggle(node.id);
    }
    onNodeClick?.(node);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Card do nó */}
      <div
        onClick={handleCardClick}
        className={`px-5 py-4 rounded-xl shadow-lg transition-all cursor-pointer relative group ${
          darkMode
            ? 'bg-gray-800 hover:bg-gray-700 hover:shadow-xl'
            : 'bg-white hover:bg-blue-50 hover:shadow-xl'
        } ${hasChildren ? 'ring-2 hover:ring-offset-2' : ''}`}
        style={{
          minWidth: '200px',
          borderTop: `3px solid ${nodeColor}`,
          backgroundColor: level === 0 
            ? darkMode 
              ? `rgba(${parseInt(nodeColor.slice(1,3),16)}, ${parseInt(nodeColor.slice(3,5),16)}, ${parseInt(nodeColor.slice(5,7),16)}, 0.15)`
              : `rgba(${parseInt(nodeColor.slice(1,3),16)}, ${parseInt(nodeColor.slice(3,5),16)}, ${parseInt(nodeColor.slice(5,7),16)}, 0.05)`
            : undefined,
          ...(hasChildren ? { outlineColor: nodeColor } : {})
        }}
      >
        {/* Avatar + Info + Chevron */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
            style={{ backgroundColor: nodeColor }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-bold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {node.name}
            </h4>
            <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {node.email}
            </p>
          </div>
          {hasChildren && (
            <div className="shrink-0" style={{ color: nodeColor }}>
              {isExpanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div 
          className="h-px my-2"
          style={{ backgroundColor: `${nodeColor}40` }}
        />

        {/* Details */}
        <div className="space-y-1 text-xs">
          {node.phone && (
            <div className={`flex items-center gap-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: nodeColor }} />
              <span>{node.phone}</span>
            </div>
          )}
          
          {node.badge && (
            <div className="inline-block px-2 py-0.5 rounded-full font-semibold" style={{
              backgroundColor: `${nodeColor}20`,
              color: nodeColor
            }}>
              {node.badge}
            </div>
          )}

          {parentName && level > 0 && (
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              👤 <strong style={{ color: nodeColor }}>{parentName}</strong>
            </div>
          )}

          {hasChildren && (
            <div className="text-xs font-semibold" style={{ color: nodeColor }}>
              📊 {node.children!.length} {node.children!.length === 1 ? 'convidado' : 'convidados'}
            </div>
          )}
        </div>
      </div>

      {/* Linhas de conexão e filhos */}
      {hasChildren && isExpanded && (
        <>
          {/* Linha vertical saindo do card */}
          <div
            className="w-0.5 h-6"
            style={{
              background: `linear-gradient(to bottom, ${nodeColor}, ${nodeColor}40)`
            }}
          />

          {/* Container para filhos */}
          <div className="relative">
            {/* Grid de filhos */}
            <div className="flex gap-12 justify-center mt-4">
              {/* Linha horizontal conectando filhos - renderizada antes dos items */}
              {node.children!.length > 1 && (
                <div className="absolute h-0.5 top-0 z-0" style={{
                  left: '0',
                  right: '0',
                  width: '100%',
                  background: `linear-gradient(to right, ${nodeColor}20, ${nodeColor}50, ${nodeColor}20)`,
                  transform: 'translateY(-12px)'
                }} />
              )}

              {node.children!.map((child) => (
                <div key={child.id} className="flex flex-col items-center relative z-10">
                  {/* Linha vertical conectando para o filho */}
                  {node.children!.length > 1 && (
                    <div
                      className="w-0.5 h-3"
                      style={{
                        background: `linear-gradient(to bottom, ${nodeColor}50, ${nodeColor}30)`,
                        transform: 'translateY(-12px)'
                      }}
                    />
                  )}

                  {/* Node recursivo */}
                  <PyramidNodeComponent
                    node={child}
                    level={level + 1}
                    darkMode={darkMode}
                    primaryColor={primaryColor}
                    onNodeClick={onNodeClick}
                    parentName={node.name}
                    isExpanded={expandedNodes.has(child.id)}
                    onToggle={onToggle}
                    expandedNodes={expandedNodes}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const NetworkPyramid: React.FC<NetworkPyramidProps> = ({
  root,
  darkMode = false,
  onNodeClick,
  primaryColor = '#3b82f6',
}) => {
  // Função para inicializar todos os nós como expandidos
  const getAllNodeIds = (node: PyramidNodeData, ids: Set<number | string> = new Set()): Set<number | string> => {
    ids.add(node.id);
    if (node.children) {
      node.children.forEach(child => getAllNodeIds(child, ids));
    }
    return ids;
  };

  const [expandedNodes, setExpandedNodes] = useState<Set<number | string>>(() => getAllNodeIds(root));
  const [transform, setTransform] = useState<Transform2D>({
    scale: 0.8,
    translateX: 0,
    translateY: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialTransform = useRef<Transform2D>({ ...transform });

  const handleToggle = (nodeId: number | string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Auto-fit na primeira renderização
  useEffect(() => {
    const autoFit = () => {
      if (containerRef.current && contentRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const contentRect = contentRef.current.getBoundingClientRect();
        
        if (contentRect.width > 0 && contentRect.height > 0) {
          const scaleX = (containerRect.width - 60) / contentRect.width;
          const scaleY = (containerRect.height - 60) / contentRect.height;
          const scale = Math.min(scaleX, scaleY, 1);
          
          setTransform({
            scale: Math.max(0.3, scale),
            translateX: 0,
            translateY: 0,
          });
        }
      }
    };

    const timer = setTimeout(autoFit, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialTransform.current = { ...transform };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;

    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;

    setTransform((prev) => ({
      ...prev,
      translateX: initialTransform.current.translateX + deltaX,
      translateY: initialTransform.current.translateY + deltaY,
    }));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.3, Math.min(3, prev.scale + delta)),
    }));
  };

  const resetView = () => {
    if (containerRef.current && contentRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      
      const scaleX = (containerRect.width - 60) / contentRect.width;
      const scaleY = (containerRect.height - 60) / contentRect.height;
      const scale = Math.min(scaleX, scaleY, 1);
      
      setTransform({
        scale: Math.max(0.3, scale),
        translateX: 0,
        translateY: 0,
      });
    }
  };

  const handleZoomIn = () => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(3, prev.scale + 0.2),
    }));
  };

  const handleZoomOut = () => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.3, prev.scale - 0.2),
    }));
  };

  const transformStyle = {
    transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
    transformOrigin: 'top center',
  };

  return (
    <div className={`relative w-full h-[700px] rounded-lg overflow-hidden border ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700' 
        : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
    }`}>
      {/* Background decorativo */}
      <div className={`absolute inset-0 opacity-5 ${
        darkMode 
          ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500' 
          : 'bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200'
      }`} />

      {/* Controles */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button
          onClick={handleZoomIn}
          className={`p-2.5 rounded-lg transition shadow-md hover:shadow-lg ${
            darkMode
              ? 'bg-gray-800 hover:bg-gray-700 text-blue-400 border border-gray-700'
              : 'bg-white hover:bg-blue-50 text-blue-600 border border-gray-200'
          }`}
          title="Aumentar zoom"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className={`p-2.5 rounded-lg transition shadow-md hover:shadow-lg ${
            darkMode
              ? 'bg-gray-800 hover:bg-gray-700 text-blue-400 border border-gray-700'
              : 'bg-white hover:bg-blue-50 text-blue-600 border border-gray-200'
          }`}
          title="Diminuir zoom"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className={`p-2.5 rounded-lg transition shadow-md hover:shadow-lg ${
            darkMode
              ? 'bg-gray-800 hover:bg-gray-700 text-blue-400 border border-gray-700'
              : 'bg-white hover:bg-blue-50 text-blue-600 border border-gray-200'
          }`}
          title="Resetar view"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Info de controle */}
      <div className={`absolute bottom-3 left-4 text-xs font-medium z-40 ${
        darkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        🖱️ Arraste para mover • 🔄 Scroll para zoom
      </div>

      {/* Container com scroll */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full flex items-start justify-center pt-6 cursor-grab active:cursor-grabbing overflow-auto"
      >
        <div
          ref={contentRef}
          style={transformStyle as React.CSSProperties}
          className="transition-transform duration-75"
        >
          <PyramidNodeComponent
            node={root}
            level={0}
            darkMode={darkMode}
            primaryColor={primaryColor}
            onNodeClick={onNodeClick}
            isExpanded={expandedNodes.has(root.id)}
            onToggle={handleToggle}
            expandedNodes={expandedNodes}
          />
        </div>
      </div>
    </div>
  );
};

export default NetworkPyramid;
