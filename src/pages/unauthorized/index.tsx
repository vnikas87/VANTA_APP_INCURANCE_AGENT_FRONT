import { useI18n } from '../../i18n';

function UnauthorizedPage() {
  const { t } = useI18n();
  return (
    <div className="panel-card p-4">
      <h4>{t('unauthorized.title')}</h4>
      <p className="mb-0 text-muted">{t('unauthorized.subtitle')}</p>
    </div>
  );
}

export default UnauthorizedPage;
