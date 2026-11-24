import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import type { ContentItem, PlatformId, TimeEntry } from '../../types/analytics';
import { SlideOverPanel } from '../ui/Primitives';

export function QuickActionModals() {
  const {
    quickActionModal,
    setQuickActionModal,
    state,
    addContentItem,
    logTimeEntry,
    navigate,
  } = useWorkspace();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<ContentItem['format']>('Video');
  const [platform, setPlatform] = useState<PlatformId>('youtube');
  const [topicInput, setTopicInput] = useState('Architecture');
  const [milestoneId, setMilestoneId] = useState(state.milestones[1]?.id ?? '');
  const [initialMetric, setInitialMetric] = useState('');
  const [contentError, setContentError] = useState('');

  const [actMilestoneId, setActMilestoneId] = useState(state.milestones[1]?.id ?? '');
  const [hours, setHours] = useState('2.0');
  const [activityType, setActivityType] = useState<TimeEntry['activityType']>('Implementation');
  const [activityNote, setActivityNote] = useState('');
  const [activityError, setActivityError] = useState('');

  const handleSubmitContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setContentError('Please enter a content title before saving.');
      return;
    }
    const parsedVal = initialMetric.trim() === '' ? null : Number(initialMetric);
    if (parsedVal !== null && (Number.isNaN(parsedVal) || parsedVal < 0)) {
      setContentError('Initial observation must be a valid non-negative number.');
      return;
    }

    const created = addContentItem({
      title,
      description,
      format,
      platform,
      topics: topicInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      milestoneId: milestoneId || undefined,
      initialPrimaryValue: parsedVal,
    });

    setTitle('');
    setDescription('');
    setInitialMetric('');
    setContentError('');
    setQuickActionModal(null);
    navigate('content-detail', created.id);
  };

  const handleSubmitActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const numericHours = Number(hours);
    if (!actMilestoneId) {
      setActivityError('Select a milestone.');
      return;
    }
    if (Number.isNaN(numericHours) || numericHours <= 0 || numericHours > 24) {
      setActivityError('Enter valid hours between 0.25 and 24.');
      return;
    }
    if (!activityNote.trim()) {
      setActivityError('Add a concise activity note.');
      return;
    }

    logTimeEntry({
      milestoneId: actMilestoneId,
      hours: numericHours,
      activityType,
      note: activityNote,
    });

    setActivityNote('');
    setActivityError('');
    setQuickActionModal(null);
  };

  return (
    <>
      <SlideOverPanel
        open={quickActionModal === 'content'}
        onClose={() => setQuickActionModal(null)}
        title="Register Content Item"
        subtitle="Creates a Content Item with an independent Platform Publication and optional Milestone link."
      >
        <form id="quick-content-form" onSubmit={handleSubmitContent} className="space-y-4">
          <div>
            <label htmlFor="qc-title" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Title
            </label>
            <input
              id="qc-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setContentError('');
              }}
              placeholder="e.g., Designing Idempotent Sync Pipelines"
              className="w-full px-3.5 py-2 text-sm bg-[#121620] border border-white/[0.1] rounded-lg text-white placeholder:text-[#64748B] focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="qc-desc" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Description
            </label>
            <textarea
              id="qc-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Core topic, hypothesis, or technical context"
              className="w-full px-3.5 py-2 text-sm bg-[#121620] border border-white/[0.1] rounded-lg text-white placeholder:text-[#64748B] focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="qc-format" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Format
              </label>
              <select
                id="qc-format"
                value={format}
                onChange={(e) => setFormat(e.target.value as ContentItem['format'])}
                className="w-full px-3 py-2 text-sm bg-[#121620] border border-white/[0.1] rounded-lg text-white focus:border-[#3B82F6] focus:outline-none"
              >
                <option value="Video">Video</option>
                <option value="Reel / Short">Reel / Short</option>
                <option value="Article">Article</option>
                <option value="Thread">Thread</option>
                <option value="Carousel">Carousel</option>
              </select>
            </div>
            <div>
              <label htmlFor="qc-platform" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Initial Publication Platform
              </label>
              <select
                id="qc-platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformId)}
                className="w-full px-3 py-2 text-sm bg-[#121620] border border-white/[0.1] rounded-lg text-white focus:border-[#3B82F6] focus:outline-none"
              >
                {state.platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="qc-topics" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Topics (comma-separated)
              </label>
              <input
                id="qc-topics"
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#121620] border border-white/[0.1] rounded-lg text-white focus:border-[#3B82F6] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="qc-milestone" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Linked Milestone (optional)
              </label>
              <select
                id="qc-milestone"
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#121620] border border-white/[0.1] rounded-lg text-white focus:border-[#3B82F6] focus:outline-none"
              >
                <option value="">None</option>
                {state.milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    M0{m.sequence} — {m.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="qc-metric" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Initial Manual Metric Observation (leave blank if not yet observed)
            </label>
            <input
              id="qc-metric"
              type="number"
              min="0"
              value={initialMetric}
              onChange={(e) => setInitialMetric(e.target.value)}
              placeholder="Leaves metric as '—' if empty"
              className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-[#121620] border border-white/[0.1] rounded-lg text-white placeholder:text-[#64748B] focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          {contentError && <p className="text-xs text-[#F87171]">{contentError}</p>}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setQuickActionModal(null)}
              className="px-4 py-2 text-xs font-medium text-[#CBD5E1] hover:text-white bg-[#121620] border border-white/[0.08] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg transition-colors"
            >
              Save Content Item
            </button>
          </div>
        </form>
      </SlideOverPanel>

      <SlideOverPanel
        open={quickActionModal === 'activity'}
        onClose={() => setQuickActionModal(null)}
        title="Log Engineering Activity"
        subtitle="Records a Time Entry and updates actual hours against the selected Milestone."
      >
        <form onSubmit={handleSubmitActivity} className="space-y-4">
          <div>
            <label htmlFor="qa-milestone" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Milestone
            </label>
            <select
              id="qa-milestone"
              value={actMilestoneId}
              onChange={(e) => setActMilestoneId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#121620] border border-white/[0.1] rounded-lg text-white focus:border-[#3B82F6] focus:outline-none"
            >
              {state.milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  M0{m.sequence} — {m.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="qa-hours" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Duration (hours)
              </label>
              <input
                id="qa-hours"
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                value={hours}
                onChange={(e) => {
                  setHours(e.target.value);
                  setActivityError('');
                }}
                className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-[#121620] border border-white/[0.1] rounded-lg text-white focus:border-[#3B82F6] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="qa-type" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Activity Type
              </label>
              <select
                id="qa-type"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value as TimeEntry['activityType'])}
                className="w-full px-3 py-2 text-sm bg-[#121620] border border-white/[0.1] rounded-lg text-white focus:border-[#3B82F6] focus:outline-none"
              >
                <option value="Architecture">Architecture</option>
                <option value="Implementation">Implementation</option>
                <option value="Testing">Testing</option>
                <option value="Documentation">Documentation</option>
                <option value="Review">Review</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="qa-note" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Work Summary
            </label>
            <textarea
              id="qa-note"
              rows={3}
              value={activityNote}
              onChange={(e) => {
                setActivityNote(e.target.value);
                setActivityError('');
              }}
              placeholder="What deliverable or technical problem did you advance?"
              className="w-full px-3.5 py-2 text-sm bg-[#121620] border border-white/[0.1] rounded-lg text-white placeholder:text-[#64748B] focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          {activityError && <p className="text-xs text-[#F87171]">{activityError}</p>}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setQuickActionModal(null)}
              className="px-4 py-2 text-xs font-medium text-[#CBD5E1] hover:text-white bg-[#121620] border border-white/[0.08] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg transition-colors"
            >
              Log Activity
            </button>
          </div>
        </form>
      </SlideOverPanel>
    </>
  );
}
