import React, { useState, useMemo } from 'react';
import { useCRM, Lead } from '../../context/CRMContext';

interface KanbanBoardProps {
    leads: Lead[];
}

const columnConfig = [
    { key: 'new', label: 'New', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.05)' },
    { key: 'contacted', label: 'Contacted', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.05)' },
    { key: 'qualified', label: 'Qualified', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.05)' },
    { key: 'converted', label: 'Converted', color: '#10b981', bg: 'rgba(16, 185, 129, 0.05)' },
];

const KanbanBoard: React.FC<KanbanBoardProps> = React.memo(({ leads }) => {
    const { updateLeadStatus } = useCRM();
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const columnsWithLeads = useMemo(() => {
        return columnConfig.map(col => ({
            ...col,
            columnLeads: leads.filter(l => l.status === col.key)
        }));
    }, [leads]);

    const onDragStart = (e: React.DragEvent, id: number) => {
        e.dataTransfer.setData('id', id.toString());
        (e.target as HTMLElement).style.opacity = '0.5';
    };

    const onDragEnd = (e: React.DragEvent) => {
        (e.target as HTMLElement).style.opacity = '1';
        setDragOverColumn(null);
    };

    const onDragOver = (e: React.DragEvent, status: string) => {
        e.preventDefault();
        setDragOverColumn(status);
    };

    const onDragLeave = () => {
        setDragOverColumn(null);
    };

    const onDrop = async (e: React.DragEvent, status: string) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('id');
        await updateLeadStatus(parseInt(id), status);
        setDragOverColumn(null);
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 animate-slide-in">
            {columnsWithLeads.map(col => {
                const { columnLeads } = col;
                const isOver = dragOverColumn === col.key;

                return (
                    <div key={col.key}
                        className="flex-1 min-w-[260px] rounded-2xl transition-all duration-200"
                        style={{
                            background: isOver ? `${col.bg.replace('0.08', '0.2')}` : col.bg,
                            border: isOver ? `2px dashed ${col.color}50` : '2px dashed transparent',
                            padding: '16px',
                        }}
                        onDragOver={e => onDragOver(e, col.key)}
                        onDragLeave={onDragLeave}
                        onDrop={e => onDrop(e, col.key)}>

                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full" style={{ background: col.color }}></div>
                                <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">{col.label}</h3>
                            </div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: `${col.color}20`, color: col.color }}>
                                {columnLeads.length}
                            </span>
                        </div>

                        {/* Cards */}
                        <div className="space-y-3">
                            {columnLeads.map(lead => (
                                <div key={lead.id} draggable
                                    onDragStart={e => onDragStart(e, lead.id)}
                                    onDragEnd={onDragEnd}
                                    className="glass-card p-4 cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                                    style={{ borderLeft: `3px solid ${col.color}` }}>
                                    <div className="text-sm font-semibold text-[var(--text-primary)] mb-1">{lead.company_name}</div>
                                    <div className="text-xs text-[var(--text-secondary)]">{lead.contact_name}</div>
                                    <div className="text-xs text-[var(--text-muted)] mt-2">{lead.email}</div>
                                    {lead.creator && (
                                        <div className="flex items-center mt-3 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white mr-2"
                                                style={{ background: col.color }}>
                                                {lead.creator.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <span className="text-[11px] text-[var(--text-muted)]">{lead.creator.name}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {columnLeads.length === 0 && (
                                <div className="text-center py-8 text-[var(--text-muted)] text-xs">
                                    Drop leads here
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

export default KanbanBoard;
