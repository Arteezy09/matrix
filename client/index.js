(function() {

  let socket = io();

  let app = new Vue({
      el: '#app',
      data: {
          str1: 'text/input.txt',
          str2: 'text/static/matrix5x5.txt',
          action: 'A'
      },
      methods: {
          doAction() {
              socket.emit('read', { str1: this.str1, str2: this.str2, action: this.action });     
          }
      },
      computed: {
          show() {
              return this.action === 'C';
          }
      }
  })

 
  socket.on('action', (data) => {
      let mtr1 = toMatrix(data.file1); 
      if (!mtr1) {
          socket.emit('err', { err: 'некорректная входная матрица' });
      }
      else {
          let mtr2, result;
          if (data.action === 'A') {
              mtr2 = identityMatrix(mtr1);
              result = toStr(multiply(mtr1, mtr2));
              socket.emit('write', { result });
          }
          else if (data.action === 'B') {
              result = toStr(sparseMatrix(mtr1));
              socket.emit('write', { result });
          }
          else if (data.action === 'C') {
              mtr2 = toMatrix(data.file2);
              if (!mtr2) {
                  socket.emit('err', { err: 'некорректная статичная матрица' });
              }
              else {
                  let mult = multiply(mtr1, mtr2);
                  if (!mult) {
                      socket.emit('err', { err: 'количество столбцов 1-ой матрицы не совпадает с количеством строк 2-ой матрицы' });
                  }
                  else {
                      result = toStr(mult);
                      socket.emit('write', { result });
                  }
              }
          }
          else {
              result = gauss(mtr1); 
              socket.emit('write', { result });
          }  
      }
  });


  function toMatrix(str) { // функция получает матрицу из строки или возвращает false (для чтения текстового файла)
      let arr = [];
      let row = 0;
      let k = 0; // индекс первого значения каждого элемента матрицы (строки)
      let m = '';

      if (!str) {
          return false;
      }

      for (let i = 0; i < str.length; i++) {
          if (Object.prototype.toString.call(arr[row]) === '[object Undefined]') {
              arr[row] = [];
          }
          if (str[i] == '\r' && str[i+1] == '\n') {
              for (let j = k; j < i; j++) {
                  m += str[j];
              }
              k = i + 2;
              if ( isNaN(+m) || !m.trim()) { // проверка на корректность числа
                  return false;
              }
              arr[row].push(+m);
              m = '';
              row = row + 1;
          }

          if (str[i] == ',') {
              for (let j = k; j < i; j++) {
                  m += str[j];
              }
              k = i + 1;
              if ( isNaN(+m) || !m.trim()) {
                  return false;
              }
              arr[row].push(+m);
              m = '';  
          }

          if (i == str.length - 1) {
              for (let j = k; j < i + 1; j++) {
                  m += str[j];
              }
              if ( isNaN(+m) || !m.trim()) {
                  return false;
              }
              arr[row].push(+m);
          }
      }
      for (let j = 1; j < arr.length; j++) {
          if ( arr[0].length != arr[j].length) {
              return false;
          }
      }
      return arr;
  }


  function toStr(matrix) { // функция получает строку из матрицы (для корректного вывода в текстовый файл)
      let result = '';
      for (let i = 0; i < matrix.length; i++) {
          for (let j = 0; j < matrix[i].length; j++) {
              result = result + matrix[i][j];
              if (i == matrix.length - 1 && j == matrix[i].length - 1) {
                  continue;
              }
              else if (j == matrix[i].length - 1) {
                  result += '\r\n';
              }
              else {
                  result += ',';
              }
          }
      }
      return result;
  }


  function identityMatrix(matrix) { // функция создает единичную n-матрицу, где n - количество столбцов matrix
      let arr = [];
      for (let i = 0; i < matrix[0].length; i++) {
          arr[i] = new Array(matrix[0].length);
      }
      for (let k = 0; k < arr.length; k++) {
          for (let j = 0; j < arr[k].length; j++) {
              if (k == j) {
                  arr[k][j] = 1;
              }
              else {
                  arr[k][j] = 0;
              }
          }
      }
      console.log(arr); // вывод единичной матрицы в консоль
      return arr;
  }


  function multiply(A, B) { // функция умножает матрицы или возвращает false
      let rowsA = A.length, colsA = A[0].length;
      let rowsB = B.length, colsB = B[0].length;
      let result = new Array(rowsA);  

      if (colsA != rowsB) {
          return false;
      }

      for (let i = 0; i < rowsA; i++) {
          result[i] = new Array(colsB); 
          for (let j = 0; j < colsB; j++) {
              result[i][j] = 0;         
              for (let k = 0; k < colsA; k++) {
                  result[i][j] += A[i][k] * B[k][j];
              }
          }
      }
      return result;
  }


  function gauss(matrix) { // функция преобразует матрицу методом гаусса
      for (let row = 0; row < matrix.length - 1; row++) { // приводит к ступенчатому виду 
          swap(matrix, row);
          let base = matrix[row];
          let div = base[row];
          if (div === 0) {
              continue;
          }
          for (let i = row + 1; i < matrix.length; i++) {
              col = matrix[i];
              let mul = col[row] / div;
              for (let j = row; j <= matrix.length; j++) {
                  col[j] -= mul * base[j];
              }
          }
      }
      // обратный ход
      for (let i = matrix.length - 1; i >= 0; i--) {
          let col = matrix[i];
          let v = col[matrix.length];

          for (let j = i + 1; j < matrix.length; j++) {
              v -= col[j] * matrix[j][matrix.length];
          }
          div = col[i];
          col[matrix.length] = div ? v / div : 0;
      }
      return matrix.map(item => item[matrix.length] );
  }


  function swap(matrix, row) { // функция меняет местами строки матрицы
      let target = row;
      let max = matrix[row][row];
      for (let i = row + 1; i < matrix.length; i++) {
          if (max === 0 || matrix[i][row] > max) {
              max = matrix[i][row];
              target = i;
          }
      }
      if (target !== row) {
          let tmp = matrix[row];
          matrix[row] = matrix[target];
          matrix[target] = tmp;
      }
  }


  function sparseMatrix(matrix) { // функция для разреженной матрицы
      let sparse = new Array(matrix[0].length);  
      let arrValue = [], arrRow = [], arrCol = [];
      let result = [];

      for (let i = 0; i < matrix[0].length; i++) { // создание случайной разреженной матрицы
          sparse[i] = new Array(matrix[0].length); 
          for (let j = 0; j < matrix[0].length; j++) {
              if ( randomInteger(0, 9) ) {
                  sparse[i][j] = 0; 
              }
              else {
                  sparse[i][j] = randomInteger(1, 9); 
                  arrValue.push(sparse[i][j]); // создание массива значений
                  arrRow.push(i);              // создание массива строк
                  arrCol.push(j);              // создание массива столбцов
              }     
          }
      }
      console.log(sparse);                       // вывод случайной разреженной матрицы в консоль

      for (let i = 0; i < matrix.length; i++) { // умножение матрицы matrix на случайную разреженную матрицу
          result[i] = new Array(matrix[0].length); 
          for (let j = 0; j < matrix[0].length; j++) {
              result[i][j] = 0;         
              for (let k = 0; k < arrValue.length; k++) {
                  if (arrCol[k] == j) {
                      result[i][j] += matrix[i][arrRow[k]] * arrValue[k];
                  }
              }
          }
      }
      return result;
  }

  
  function randomInteger(min, max) { 
      // получить случайное число от (min-0.5) до (max+0.5)
      let rand = min - 0.5 + Math.random() * (max - min + 1);
      return Math.round(rand);
  }

})();



