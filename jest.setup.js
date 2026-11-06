// O AsyncStorage real depende de módulo nativo; o store o carrega assim que é importado.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
