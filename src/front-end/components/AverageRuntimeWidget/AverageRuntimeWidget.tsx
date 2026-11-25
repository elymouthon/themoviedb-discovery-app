import DashboardWidget, {
  type WidgetStatus,
} from '../DashboardWidget/DashboardWidget';

type AverageRuntimeWidgetProps = {
  /** Current display state of the widget. */
  status: WidgetStatus;
  /**
   * Average runtime in minutes, computed on the valid (strictly positive)
   * runtimes only. Absent when no movie has a known runtime: the widget then
   * shows its empty state instead of displaying zero.
   */
  averageRuntime?: number | null;
};

// Runtimes are displayed as whole minutes, with the French number format.
const minutesFormat = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

/**
 * Checks that the average runtime is a usable value.
 * @returns True when the value is a strictly positive finite number.
 */
function isValidRuntime(value?: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * Dashboard widget "Durée moyenne": average runtime of the catalog movies,
 * in minutes.
 * @returns The JSX element representing the widget.
 */
export default function AverageRuntimeWidget({
  status,
  averageRuntime,
}: AverageRuntimeWidgetProps) {
  const hasRuntime = isValidRuntime(averageRuntime);
  // A successful load without a valid runtime is displayed as the empty state.
  const displayedStatus: WidgetStatus =
    status === 'success' && !hasRuntime ? 'empty' : status;

  return (
    <DashboardWidget
      title="Durée moyenne"
      status={displayedStatus}
      emptyMessage="Aucune durée connue pour le moment."
      errorMessage="Impossible de charger la durée moyenne."
    >
      {hasRuntime && (
        <p className="dashboard-widget-value">
          {minutesFormat.format(averageRuntime)}{' '}
          <abbr className="dashboard-widget-unit" title="minutes">
            min
          </abbr>
        </p>
      )}
    </DashboardWidget>
  );
}
