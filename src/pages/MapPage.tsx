import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Asset, CorridorSection, MaintenanceTask, Department } from '../types';
import { SIMULATED_DISCLAIMER } from '../data/simulatedData';
import {
  MapPin,
  Layers,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  CalendarRange,
  Zap,
  Radio,
  Train,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';

interface MapPageProps {
  assets: Asset[];
  sections: CorridorSection[];
  tasks: MaintenanceTask[];
  onSelectSectionForPlanner?: (sectionCode: string) => void;
}

export function MapPage({
  assets,
  sections,
  tasks,
  onSelectSectionForPlanner
}: MapPageProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  // Filter states
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [stateFilter, setStateFilter] = useState<string>('All');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedSection, setSelectedSection] = useState<CorridorSection | null>(null);

  // Helper to determine asset state
  const getAssetState = (asset: Asset): 'Normal' | 'Planned Maintenance' | 'Critical' => {
    const assetTasks = tasks.filter(t => t.assetId === asset.assetId);
    const hasCriticalOrOverdue = assetTasks.some(
      t => t.priority === 'Critical' || t.daysOverdue > 0 || t.criticality === 'Critical'
    );
    if (hasCriticalOrOverdue || asset.condition === 'Critical' || asset.condition === 'Poor') {
      return 'Critical';
    }
    const hasScheduledOrBundled = assetTasks.some(
      t => t.status === 'Bundled' || t.status === 'Scheduled'
    );
    if (hasScheduledOrBundled || asset.condition === 'Fair') {
      return 'Planned Maintenance';
    }
    return 'Normal';
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Center map on Northern-North Central Indian Railways mainline corridor
    const map = L.map(mapContainerRef.current, {
      center: [26.4, 81.2],
      zoom: 7,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Indian Railways SIH26027 Prototype',
      maxZoom: 18
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layersGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render Polylines and Markers when filters or data change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layersGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Draw railway corridor sections
    sections.forEach(sec => {
      if (!sec.startStation || !sec.endStation) return;

      const trackColor =
        sec.status === 'Critical Maintenance'
          ? '#ef4444'
          : sec.status === 'Maintenance Pending'
          ? '#f59e0b'
          : '#10b981';

      const polyline = L.polyline(
        [
          [sec.startStation.lat, sec.startStation.lng],
          [sec.endStation.lat, sec.endStation.lng]
        ],
        {
          color: trackColor,
          weight: sec.status === 'Critical Maintenance' ? 6 : 5,
          opacity: 0.85,
          dashArray: sec.status === 'Critical Maintenance' ? '8, 8' : undefined
        }
      );

      polyline.on('click', () => {
        setSelectedSection(sec);
        setSelectedAsset(null);
      });

      polyline.bindTooltip(
        `<strong>Section ${sec.code}</strong>: ${sec.name}<br/>Status: ${sec.status}<br/>Condition: ${sec.conditionRating}/100`,
        { sticky: true }
      );

      polyline.addTo(layerGroup);

      // Station start node
      const startMarker = L.circleMarker([sec.startStation.lat, sec.startStation.lng], {
        radius: 5,
        fillColor: '#1e293b',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1
      });
      startMarker.bindTooltip(`Station: ${sec.startStation.name}`, { direction: 'top' });
      startMarker.addTo(layerGroup);
    });

    // Draw Assets
    assets.forEach(asset => {
      if (asset.lat === undefined || asset.lng === undefined) return;

      // Filter by Department
      if (departmentFilter !== 'All' && asset.department !== departmentFilter) return;

      // Filter by State
      const assetState = getAssetState(asset);
      if (stateFilter !== 'All' && assetState !== stateFilter) return;

      const markerColor =
        assetState === 'Critical'
          ? '#dc2626'
          : assetState === 'Planned Maintenance'
          ? '#d97706'
          : '#059669';

      const radius = assetState === 'Critical' ? 9 : assetState === 'Planned Maintenance' ? 8 : 6;

      const marker = L.circleMarker([asset.lat, asset.lng], {
        radius,
        fillColor: markerColor,
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.95
      });

      marker.bindTooltip(
        `<div class="font-sans text-xs">
          <strong>${asset.assetId}</strong> (${asset.department})<br/>
          <span>${asset.assetType}</span><br/>
          <span class="font-semibold text-${assetState === 'Critical' ? 'red' : assetState === 'Planned Maintenance' ? 'amber' : 'emerald'}-600">
            ${assetState.toUpperCase()}
          </span>
        </div>`,
        { direction: 'top', offset: [0, -5] }
      );

      marker.on('click', () => {
        setSelectedAsset(asset);
        // also set section
        const matchingSec = sections.find(s => s.code === asset.section) || null;
        setSelectedSection(matchingSec);
      });

      marker.addTo(layerGroup);
    });
  }, [assets, sections, tasks, departmentFilter, stateFilter]);

  // Handle fly to section
  const handleFlyToSection = (sectionCode: string) => {
    const sec = sections.find(s => s.code === sectionCode);
    if (!sec || !sec.startStation || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([sec.startStation.lat, sec.startStation.lng], 9, {
      duration: 1.2
    });
    setSelectedSection(sec);
  };

  // Active tasks for currently selected asset
  const selectedAssetTasks = selectedAsset
    ? tasks.filter(t => t.assetId === selectedAsset.assetId)
    : [];

  return (
    <div className="space-y-4">
      {/* Top Header & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              PRD Section 19: Interactive Map
            </span>
            <span className="text-xs text-slate-500 font-mono">OpenStreetMap Engine</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>Corridor Geospatial Asset & Track Map</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time geospatial layout of railway tracks, signaling interlocking points, traction catenary, and active maintenance states.
          </p>
        </div>

        {/* Quick jump to Section */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Jump to Section:</label>
          <select
            onChange={e => handleFlyToSection(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-800"
          >
            <option value="">Select Corridor Section...</option>
            {sections.map(s => (
              <option key={s.code} value={s.code}>
                Section {s.code}: {s.name} ({s.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Map Control Bar & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-lg border border-slate-200 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Map Filters:</span>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-[11px]">Department:</span>
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering (TMS - Track)</option>
              <option value="S&T">S&T (SMMS - Signals)</option>
              <option value="TRD">TRD (TDMS - Catenary/Power)</option>
            </select>
          </div>

          {/* Asset State Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-[11px]">Asset State:</span>
            <select
              value={stateFilter}
              onChange={e => setStateFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800"
            >
              <option value="All">All States (Normal, Planned, Critical)</option>
              <option value="Normal">Normal Condition Only</option>
              <option value="Planned Maintenance">Planned Maintenance / Bundled</option>
              <option value="Critical">Critical / Overdue Defect</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
            <span>Planned Maint.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-red-600 inline-block border-2 border-white shadow-xs animate-pulse"></span>
            <span>Critical Overdue</span>
          </div>
        </div>
      </div>

      {/* Main Content: Map Container + Inspection Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Leaflet OpenStreetMap */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm relative">
          <div
            ref={mapContainerRef}
            className="w-full h-[580px] z-0"
            style={{ minHeight: '520px' }}
          />

          {/* Map Overlay Badge */}
          <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-xs text-white p-2.5 rounded-md border border-slate-800 text-[11px] max-w-sm z-1000">
            <div className="font-bold flex items-center gap-1.5 text-blue-400">
              <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>Indian Railways Golden Quadrilateral Route</span>
            </div>
            <p className="text-slate-300 text-[10px] mt-0.5 leading-tight">
              Click any colored asset node or track corridor polyline to inspect live condition, speed restrictions, and AI bundling recommendations.
            </p>
          </div>
        </div>

        {/* Right 1 Col: Asset / Corridor Inspection Panel */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Asset & Corridor Inspector</span>
              </h3>
              {selectedAsset && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    getAssetState(selectedAsset) === 'Critical'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : getAssetState(selectedAsset) === 'Planned Maintenance'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {getAssetState(selectedAsset).toUpperCase()}
                </span>
              )}
            </div>

            {/* If no asset or section selected */}
            {!selectedAsset && !selectedSection && (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-xs font-semibold text-slate-700">No Asset Selected</div>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Click on any asset marker or track segment on the OpenStreetMap to view maintenance status and recommendation details.
                </p>
              </div>
            )}

            {/* Asset Details View */}
            {selectedAsset && (
              <div className="mt-4 space-y-4 text-xs">
                {/* Header card */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-blue-900">
                      {selectedAsset.assetId}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                      {selectedAsset.department}
                    </span>
                  </div>
                  <div className="font-bold text-slate-800">{selectedAsset.assetType}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{selectedAsset.locationName || `Section ${selectedAsset.section}`}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Condition Rating</div>
                    <div className="font-extrabold text-sm text-slate-900 mt-0.5">
                      {selectedAsset.condition}
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Criticality</div>
                    <div className="font-extrabold text-sm text-red-600 mt-0.5">
                      {selectedAsset.criticality}
                    </div>
                  </div>
                </div>

                {/* Section Speed Restrictions */}
                {selectedSection && (
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded text-[11px] space-y-1 text-amber-900">
                    <div className="font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                      <span>Speed Restriction & Caution:</span>
                    </div>
                    <div>{selectedSection.speedRestriction || 'No active speed caution order.'}</div>
                  </div>
                )}

                {/* Associated Maintenance Tasks */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Active Maintenance Tasks ({selectedAssetTasks.length}):</span>
                  </div>

                  {selectedAssetTasks.length === 0 ? (
                    <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>All preventive maintenance up-to-date. No open defect tickets.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedAssetTasks.map(t => (
                        <div
                          key={t.taskId}
                          className="p-2.5 bg-white rounded border border-slate-200 space-y-1 shadow-2xs"
                        >
                          <div className="flex items-center justify-between font-mono">
                            <span className="font-bold text-blue-900">{t.taskId}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                t.priority === 'Critical'
                                  ? 'bg-red-100 text-red-800'
                                  : t.priority === 'High'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {t.priority}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-700 font-medium">{t.taskDescription}</div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                            <span>Duration: {t.duration}h</span>
                            <span>Due: {t.dueDate} {t.daysOverdue > 0 && `(${t.daysOverdue}d overdue)`}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section Only View (if polyline clicked directly) */}
            {!selectedAsset && selectedSection && (
              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-mono font-bold text-sm text-blue-900">
                    Section {selectedSection.code}
                  </div>
                  <div className="font-bold text-slate-800">{selectedSection.name}</div>
                  <div className="text-[11px] font-semibold text-slate-600">
                    Track Health Rating: <span className="font-bold text-blue-600">{selectedSection.conditionRating}/100</span>
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    <span>Operational Speed Restriction:</span>
                  </div>
                  <div>{selectedSection.speedRestriction || 'Full line speed operational (130 km/h).'}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-400">Pending Tasks</div>
                    <div className="font-bold text-slate-900 text-sm">{selectedSection.pendingTasksCount}</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-400">Next Block Window</div>
                    <div className="font-bold text-blue-700 text-xs mt-0.5">{selectedSection.nextBlockWindow}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action button */}
          {(selectedAsset || selectedSection) && (
            <div className="pt-4 mt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  const targetCode = selectedAsset?.section || selectedSection?.code;
                  if (targetCode && onSelectSectionForPlanner) {
                    onSelectSectionForPlanner(targetCode);
                  }
                }}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <CalendarRange className="w-4 h-4" />
                <span>Optimize Blocks for Section {selectedAsset?.section || selectedSection?.code}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Simulated Disclaimer */}
      <div className="p-2.5 bg-slate-100 rounded border border-slate-200 text-center text-[11px] text-slate-500 font-mono">
        {SIMULATED_DISCLAIMER}
      </div>
    </div>
  );
}
