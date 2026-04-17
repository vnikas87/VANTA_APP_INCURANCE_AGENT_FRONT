import { useI18n } from '../../i18n';

function AppFooter() {
  const { t } = useI18n();
  return (
    <footer className="app-footer px-4 py-3">
      <span className="text-muted fs-12">{t('footer.template')}</span>
    </footer>
  );
}

export default AppFooter;
