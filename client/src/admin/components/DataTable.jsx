import React, { useState, useMemo } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import './DataTable.css';

/**
 * DataTable — generic admin table with search, bulk-select, pagination
 *
 * @param {Array}   columns         — [{ key, label, render?, align?, width? }]
 * @param {Array}   data            — row objects
 * @param {string}  rowKey          — unique key field (default: 'id')
 * @param {boolean} selectable      — checkbox column
 * @param {Array}   bulkActions     — [{ label, onClick(selectedIds), variant? }]
 * @param {boolean} searchable      — show search input
 * @param {string}  searchPlaceholder
 * @param {Function} onSearch       — external search handler (if omitted, client-side)
 * @param {number}  pageSize        — rows per page (default: 10)
 * @param {boolean} loading
 * @param {node}    emptyMessage
 * @param {number}  totalItems      — for server-side pagination
 * @param {number}  currentPage     — controlled page
 * @param {(page:number)=>void} onPageChange — server-side page change
 */
export default function DataTable({
    columns = [],
    data = [],
    rowKey = 'id',
    selectable = false,
    bulkActions = [],
    searchable = true,
    searchPlaceholder = 'Tìm kiếm...',
    onSearch,
    pageSize = 10,
    loading = false,
    emptyMessage = 'Không có dữ liệu',
    totalItems,
    currentPage: controlledPage,
    onPageChange,
}) {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [internalPage, setInternalPage] = useState(1);
    const [showBulkMenu, setShowBulkMenu] = useState(false);

    const page = controlledPage ?? internalPage;
    const setPage = onPageChange ?? setInternalPage;

    // Client-side search filter
    const filtered = useMemo(() => {
        if (onSearch || !search.trim()) return data;
        const q = search.toLowerCase();
        return data.filter(row =>
            columns.some(col => {
                const val = row[col.key];
                return val && String(val).toLowerCase().includes(q);
            })
        );
    }, [data, search, columns, onSearch]);

    // Pagination
    const total = totalItems ?? filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const rows = onPageChange
        ? filtered
        : filtered.slice((page - 1) * pageSize, page * pageSize);

    // Selection helpers
    const allSelected = rows.length > 0 && rows.every(r => selected.has(r[rowKey]));

    const toggleAll = () => {
        if (allSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(rows.map(r => r[rowKey])));
        }
    };

    const toggleRow = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleSearch = (value) => {
        setSearch(value);
        if (onSearch) onSearch(value);
        setPage(1);
        setSelected(new Set());
    };

    return (
        <div className="dtable">
            {/* Toolbar */}
            {(searchable || (selectable && selected.size > 0)) && (
                <div className="dtable__toolbar">
                    {searchable && (
                        <div className="dtable__search">
                            <FiSearch size={14} className="dtable__search-icon" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => handleSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="dtable__search-input"
                            />
                        </div>
                    )}

                    {selectable && selected.size > 0 && (
                        <div className="dtable__bulk">
                            <span className="dtable__bulk-count">{selected.size} đã chọn</span>
                            <div className="dtable__bulk-dropdown">
                                <button
                                    className="dtable__bulk-btn"
                                    onClick={() => setShowBulkMenu(!showBulkMenu)}
                                >
                                    Thao tác <FiChevronDown size={14} />
                                </button>
                                {showBulkMenu && (
                                    <div className="dtable__bulk-menu">
                                        {bulkActions.map((action, i) => (
                                            <button
                                                key={i}
                                                className={`dtable__bulk-action ${action.variant ? `dtable__bulk-action--${action.variant}` : ''}`}
                                                onClick={() => {
                                                    action.onClick([...selected]);
                                                    setShowBulkMenu(false);
                                                    setSelected(new Set());
                                                }}
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Table */}
            <div className="dtable__wrap">
                <table className="dtable__table">
                    <thead>
                        <tr>
                            {selectable && (
                                <th className="dtable__th dtable__th--check">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        className="dtable__checkbox"
                                    />
                                </th>
                            )}
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    className="dtable__th"
                                    style={{ textAlign: col.align || 'left', width: col.width }}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={`skel-${i}`} className="dtable__tr">
                                    {selectable && <td className="dtable__td"><div className="dtable__skeleton dtable__skeleton--check" /></td>}
                                    {columns.map(col => (
                                        <td key={col.key} className="dtable__td">
                                            <div className="dtable__skeleton" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0)} className="dtable__empty">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            rows.map(row => (
                                <tr
                                    key={row[rowKey]}
                                    className={`dtable__tr ${selected.has(row[rowKey]) ? 'dtable__tr--selected' : ''}`}
                                >
                                    {selectable && (
                                        <td className="dtable__td dtable__td--check">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(row[rowKey])}
                                                onChange={() => toggleRow(row[rowKey])}
                                                className="dtable__checkbox"
                                            />
                                        </td>
                                    )}
                                    {columns.map(col => (
                                        <td
                                            key={col.key}
                                            className="dtable__td"
                                            style={{ textAlign: col.align || 'left' }}
                                        >
                                            {col.render ? col.render(row[col.key], row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="dtable__pagination">
                    <span className="dtable__page-info">
                        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}
                    </span>
                    <div className="dtable__page-btns">
                        <button
                            className="dtable__page-btn"
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                        >
                            <FiChevronLeft size={16} />
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let p;
                            if (totalPages <= 5) {
                                p = i + 1;
                            } else if (page <= 3) {
                                p = i + 1;
                            } else if (page >= totalPages - 2) {
                                p = totalPages - 4 + i;
                            } else {
                                p = page - 2 + i;
                            }
                            return (
                                <button
                                    key={p}
                                    className={`dtable__page-btn ${p === page ? 'dtable__page-btn--active' : ''}`}
                                    onClick={() => setPage(p)}
                                >
                                    {p}
                                </button>
                            );
                        })}
                        <button
                            className="dtable__page-btn"
                            disabled={page >= totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            <FiChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
