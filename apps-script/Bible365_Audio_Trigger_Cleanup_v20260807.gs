/**
 * Bible365 obsolete audio trigger cleanup
 * Version: 2026-08-07
 *
 * Gmail failure evidence confirms these handlers are still scheduled even though
 * the functions are absent from canonical source:
 * - syncDeliveryForToday
 * - refreshDeliverySummaryForToday
 *
 * Do not recreate these functions as no-op handlers. Remove only their triggers.
 */

const B365_OBSOLETE_AUDIO_HANDLERS = [
  'syncDeliveryForToday',
  'refreshDeliverySummaryForToday',
];

function inspectBible365ObsoleteAudioTriggers() {
  const triggers = ScriptApp.getProjectTriggers()
    .filter(t => B365_OBSOLETE_AUDIO_HANDLERS.includes(t.getHandlerFunction()))
    .map(t => ({
      handler: t.getHandlerFunction(),
      eventType: String(t.getEventType()),
      source: String(t.getTriggerSource()),
      uniqueId: t.getUniqueId(),
    }));
  const result = { count: triggers.length, triggers };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function removeBible365ObsoleteAudioTriggers() {
  const removed = [];
  ScriptApp.getProjectTriggers().forEach(trigger => {
    const handler = trigger.getHandlerFunction();
    if (!B365_OBSOLETE_AUDIO_HANDLERS.includes(handler)) return;
    removed.push({ handler, uniqueId: trigger.getUniqueId() });
    ScriptApp.deleteTrigger(trigger);
  });

  const remaining = inspectBible365ObsoleteAudioTriggers();
  if (remaining.count !== 0) {
    throw new Error(`B365_OBSOLETE_TRIGGER_DELETE_FAILED: ${JSON.stringify(remaining)}`);
  }

  const result = { ok: true, removedCount: removed.length, removed };
  console.log(JSON.stringify(result, null, 2));
  return result;
}
