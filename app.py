from flask import Flask, render_template, request, jsonify
import numpy as np
app = Flask(__name__)

@app.route('/')
def index() :
    return render_template("index.html")

@app.route('/calculate_pagerank', methods=['POST'])
def calculate_pagerank():
    data = request.get_json()
    number_of_pages = data.get('numberOfPages')
    matrix = data.get('matrix')

    print("Matrice d'adjacence reçue:", matrix)  # Impression pour vérifier la matrice

    landa = 0.85
    eplsilon = 0.000000000001
    N = number_of_pages

    # Initialisation
    R_vector = [1 / N] * N
    print("R_vector initial:", R_vector)

    # Calcul de la matrice d'adjacence
    row_sums = [sum(row) for row in matrix]
    T_matrix = np.zeros((N, N))

    for i in range(N):
        for j in range(N):
            if matrix[i][j] == 0:
                T_matrix[i][j] = 0
            else:
                T_matrix[i][j] = landa / row_sums[i]

    D_matrix = np.zeros((N, N))
    indices_of_zero = [i for i, value in enumerate(row_sums) if value == 0]

    for i in range(N):
        if i in indices_of_zero:
            D_matrix[i, :] = 1 / N
        else:
            D_matrix[i, :] = (1 - landa) / N

    P_matrix = D_matrix + T_matrix
    number_of_iterations = 0

    while True:
        R_vector_next = np.dot(R_vector, P_matrix)
        norm = np.linalg.norm(R_vector_next - R_vector)
        print("R_vector_next:", R_vector_next)  # Impression des valeurs du vecteur

        if norm <= eplsilon:
            break
        R_vector = R_vector_next
        number_of_iterations += 1

    return jsonify({
        'numberOfPages': number_of_pages,
        'matrix': matrix,
        'pagerankVector': R_vector_next.tolist()  # Renvoyer le vecteur PageRank
    })

@app.route('/user')
def get_user() :
    return "<h1>User</h1>"

if __name__ == "__main__" :
    app.run(debug=True)





