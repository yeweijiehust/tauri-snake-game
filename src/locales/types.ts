export type LocaleKey =
  | 'app.title'
  | 'game.start'
  | 'game.pause'
  | 'game.resume'
  | 'game.over'
  | 'game.score'
  | 'game.playAgain'
  | 'lang.en'
  | 'lang.zh'
  | 'history.title'
  | 'history.empty'
  | 'history.score'
  | 'history.date'
  | 'history.button'
  | 'history.clear'
  | 'history.confirm'
  | 'history.yes'
  | 'history.no';

export type LocaleDict = Record<LocaleKey, string>;
