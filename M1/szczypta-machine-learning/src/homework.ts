import { addMatrices, multiplyMatrices, transpose, assertMatricesDimensionMatch, assertMatricesCompatible } from "./matrix-operations";
import { fromJSONFile, jsonFilePath, randomizeMatrix, randomizeVector } from "./utils";
import { vectorSum, dotProduct } from "./vector-operations";
import { Matrix, Vector } from "./types";
import { displayVector, displayMatrix } from "./display";

// HINT: (w zaleności od wybranego kierunku implementacji) może być mnożenie macierzy przez wektory - tę operację będzie trzeba zaimplementować 😉 
// ale nie jest to konieczne 😎

// HINT: w mnożeniu macierzy kolejność ma znaczenie - bo w zależności od kolejności albo wymiary obydwu składników pasują do siebie albo nie.

// HINT: wstań od komputera i przemyśl problem. Serio. Zastanów się, ile linijek wystarczy aby podać rozwiązanie :)
// (traktując "linijkę" jako pojedynczą operację na tensorach) 😎

// PROŚBA: jeśli znasz rozwiązanie, to nie spamuj discorda - a przynajmniej nie od razu. Pozwól innym pomóżdżyć 😎

const inputCases = ['case-1.json', 'case-2.json', 'case-3.json', 'case-4.json'];

inputCases.forEach((caseName, index) => {
    const { WK_Matrix, WQ_Matrix, X_Input_Matrix } = fromJSONFile(jsonFilePath(caseName));

    const x1_vector = X_Input_Matrix[0];
    // console.log('x1_vector');
    // console.log(displayVector(x1_vector, -1));

    // Step 1: compute Q = X * W^Q and K = X * W^K
    const Q_Matrix = multiplyMatrices(X_Input_Matrix, WQ_Matrix);
    const K_Matrix = multiplyMatrices(X_Input_Matrix, WK_Matrix);

    // Step 2: S = Q * K^T
    const K_Transposed = transpose(K_Matrix);
    const Attention_Score_Matrix = multiplyMatrices(Q_Matrix, K_Transposed);

    console.log(`Attention Score Matrix S (${caseName}) = Q * K^T`);
    console.log(displayMatrix(Attention_Score_Matrix, -1));

    if (index < inputCases.length - 1) {
        console.log('\n');
    }

    // Quick sanity check: s_11 should equal dot(q1, k1)
    // const q1_vector = Q_Matrix[0];
    // const k1_vector = K_Matrix[0];
    // const s11_dot = dotProduct(q1_vector, k1_vector);
    // console.log('s_11 from matrix:', Attention_Score_Matrix[0][0], '| s_11 via dot product:', s11_dot);
});
