import './DashboardPage.css';

/**
 * Movies dashboard page. Widgets will be added in the dedicated tickets;
 * until then the page shows an explicit empty state.
 * @returns The JSX element representing the dashboard page.
 */
export default function DashboardPage() {
  return (
    <main className="app-shell dashboard-page">
      <header className="app-header">
        <p className="dashboard-eyebrow">TMDB Discovery</p>
        <h1>Tableau de bord des films</h1>
        <h2>
          Indicateurs sur les films, leurs genres et leurs pays de production,
          d'après les données de <b>The Movie Database</b>
        </h2>
      </header>

      <section
        className="dashboard-widgets"
        aria-labelledby="dashboard-widgets-title"
      >
        <h2 id="dashboard-widgets-title" className="dashboard-section-title">
          Indicateurs
        </h2>
        <div className="dashboard-empty">
          <p className="dashboard-empty-title">Aucun widget pour le moment</p>
          <p className="dashboard-empty-description">
            Les indicateurs du catalogue apparaîtront ici dès que les widgets
            seront disponibles.
          </p>
        </div>
      </section>
    </main>
  );
}
