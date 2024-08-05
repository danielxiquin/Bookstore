import * as fs from 'fs';
import * as readline from 'readline';


class Book{
    isbn: string;
    name: string;
    author: string;
    categoria: string;
    price: string;
    quantity: string;

    constructor(isbn: string, name: string, author: string, categoria: string, price: string, quantity: string){
        this.isbn = isbn;
        this.name = name;
        this.author = author;
        this.categoria = categoria;
        this.price = price;
        this.quantity = quantity;
    }

    static fromJson(json: any): Book {
        return new Book(json.isbn, json.name, json.author, json.categoria, json.price, json.quantity);
    }

    toJson(): any{
        return {
            isbn: this.isbn,
            name: this.name,
            author: this.author,
            categoria: this.categoria,
            price: this.price,
            quantity: this.quantity
        }
    }

}

class BTreeNode{
    books: Book[];
    children: BTreeNode[];
    isLeaf: boolean;

    constructor( isLeaf: boolean){
        this.books = [],
        this.children = [],
        this.isLeaf = isLeaf
    }


    insertNonFull(book: Book): void{
        let i = this.books.length-1;

        if(this.isLeaf){
            while(i > 0 && this.books[i] && this.books[i].isbn > book.isbn){
                this.books[i+1] = this.books[i];
                i--;
            }
            this.books[i+1] =book;
        }else{
            while(i > 0 && this.books[i].isbn > book.isbn){
                i--;
            }

            if(this.children[i+1].books.length === 4){
                this.splitChild(i+1, this.children[i+1]);
                if (this.books[i + 1].isbn < book.isbn) {
                    i++;
                }
            }  
            this.children[i + 1].insertNonFull(book);  
        }
    }

    splitChild(i: number, y: BTreeNode): void {
        let z = new BTreeNode(y.isLeaf);
        z.books = y.books.splice(2, y.books.length -2); 
        
        if (!y.isLeaf) {
            z.children = y.children.splice(2, y.children.length-2); 
        }
        
        this.children.splice(i + 1, 0, z); 
        this.books.splice(i, 0, y.books.splice(1, 1)[0]); 
    }

    findkey(isbn: string): number {
        for (let idx = 0; idx < this.books.length; idx++) {
            if (this.books[idx] && this.books[idx].isbn.localeCompare(isbn, undefined, { numeric: true }) === 0) {
                return idx;
            }
        }
        return this.books.length;
    }

    updateBook(isbn: string, updatedData: any): boolean {
        let idx = this.findkey(isbn);

        if (idx < this.books.length) {
            if (this.books[idx].isbn === isbn) {
                for (let key in updatedData) {
                    if (updatedData.hasOwnProperty(key)) {
                        (this.books[idx] as any)[key] = updatedData[key];
                    }
                }
                return true;
            }
        }

        if (this.isLeaf) {
            return false;
        } else {
            if (idx < this.children.length) {
                return this.children[idx].updateBook(isbn, updatedData);
            } else {
                return false;
            }
        }
    }
    
    searchByName(name: string): Book | null {
        this.books = this.books.filter(book => book!== null && book!== undefined);
        return this.books.find(book => book && book.name === name)?? null;
    }

    
    removeFromLeaf(idx: number) {
        this.books.splice(idx, 1);
    }

    removeFromNonLeaf(idx: number, t: number) {
        const pred = this.getPredecessor(idx);
        this.books[idx] = pred;
        this.children[idx].remove(pred.isbn, t);
    }

    getPredecessor(idx: number): Book {
        let current = this.children[idx];
        while (!current.isLeaf) {
            current = current.children[current.books.length];
        }
        return current.books[current.books.length - 1];
    }

    fill(idx: number, t: number) {
        if (idx !== 0 && this.children[idx - 1].books.length >= t) {
            this.borrowFromPrev(idx);
        } else if (idx !== this.books.length && this.children[idx + 1].books.length >= t) {
            this.borrowFromNext(idx);
        } else {
            if (idx !== this.books.length) {
                this.merge(idx);
            } else {
                this.merge(idx - 1);
            }
        }
    }

    borrowFromPrev(idx: number) {
        const child = this.children[idx];
        const sibling = this.children[idx - 1];

        for (let i = child.books.length - 1; i >= 0; --i) {
            child.books[i + 1] = child.books[i];
        }

        if (!child.isLeaf) {
            for (let i = child.children.length - 1; i >= 0; --i) {
                child.children[i + 1] = child.children[i];
            }
        }

        child.books[0] = this.books[idx - 1];

        if (!this.isLeaf) {
            child.children[0] = sibling.children[sibling.books.length];
        }

        this.books[idx - 1] = sibling.books[sibling.books.length - 1];
        sibling.books.length -= 1;
        child.books.length += 1;
    }

    borrowFromNext(idx: number) {
        const child = this.children[idx];
        const sibling = this.children[idx + 1];

        child.books[child.books.length] = this.books[idx];

        if (!child.isLeaf) {
            child.children[child.books.length + 1] = sibling.children[0];
        }

        this.books[idx] = sibling.books[0];

        for (let i = 1; i < sibling.books.length; ++i) {
            sibling.books[i - 1] = sibling.books[i];
        }

        if (!sibling.isLeaf) {
            for (let i = 1; i <= sibling.books.length; ++i) {
                sibling.children[i - 1] = sibling.children[i];
            }
        }

        sibling.books.length -= 1;
        child.books.length += 1;
    }

    merge(idx: number) {
        const child = this.children[idx];
        const sibling = this.children[idx + 1];

        child.books[child.books.length] = this.books[idx];

        for (let i = 0; i < sibling.books.length; ++i) {
            child.books[child.books.length + 1 + i] = sibling.books[i];
        }

        if (!child.isLeaf) {
            for (let i = 0; i <= sibling.books.length; ++i) {
                child.children[child.books.length + 1 + i] = sibling.children[i];
            }
        }

        for (let i = idx + 1; i < this.books.length; ++i) {
            this.books[i - 1] = this.books[i];
        }

        for (let i = idx + 2; i <= this.books.length; ++i) {
            this.children[i - 1] = this.children[i];
        }

        child.books.length += sibling.books.length + 1;
        this.books.length -= 1;
        this.children.length -= 1;
    }

    remove(isbn: string, t: number) {
        const idx = this.findkey(isbn);

        if (idx < this.books.length && this.books[idx].isbn === isbn) {
            if (this.isLeaf) {
                this.removeFromLeaf(idx);
            } else {
                this.removeFromNonLeaf(idx, t);
            }
        } else {
            if (this.isLeaf) {
                return;
            }

            const flag = (idx === this.books.length);

            if (this.children[idx].books.length < t) {
                this.fill(idx, t);
            }

            if (flag && idx > this.books.length) {
                this.children[idx - 1].remove(isbn, t);
            } else {
                this.children[idx].remove(isbn, t);
            }
        }
    }
}

class Btree {
    root: BTreeNode | null;
    t: number;

    constructor(){
        this.root = null;
        this.t = 5;
    }

    searchByName(name: string): Book | null {
        if (!name || !this.root) return null;
        return this.root.searchByName(name);
    }

    insert(book: Book): void{
        if(this.root === null){
            this.root = new BTreeNode(true);
            this.root.books.push(book);
        }else{
            if(this.root.books.length === this.t-1){
                let s = new BTreeNode(false);
                s.children.push(this.root);
                s.splitChild(0, this.root);

                let i =0;
                if(s.books[0].isbn < book.isbn){
                    i++
                }

                s.children[i].insertNonFull(book);
                this.root = s;
            }else{
                this.root.insertNonFull(book);
            }
        }
    }

    insertFromJson(json: any): void {
        const book = Book.fromJson(json);
        this.insert(book);
    }

    patchFromJson(json: any): boolean {
        const isbn = json.isbn;
        if (!isbn || !this.root) return false;
        return this.root.updateBook(isbn, json);
    }

    delete(isbn: string): void {
        if (!this.root) {
            return;
        }

        this.root.remove(isbn, this.t);

        if (this.root.books.length === 0) {
            if (this.root.isLeaf) {
                this.root = null;
            } else {
                this.root = this.root.children[0];
            }
        }
    }

    deleteFromJson(json: any): boolean {
        const isbn = json.isbn;
        if (!isbn) return false;

        this.delete(isbn);
        return true;
    }


}



async function leerCSV(filename: string, tree: Btree): Promise<void> {
    const rl = readline.createInterface({
        input: fs.createReadStream(filename),
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        let trimmedLine = line.trim();
        if (trimmedLine.startsWith('"') && trimmedLine.endsWith('"')) {
            trimmedLine = trimmedLine.slice(1, -1);
        }

        const [operation, data] = trimmedLine.split(';');
        if (!operation || !data) {
            console.error(`Error al analizar la línea: "${line}"`);
            continue;
        }

        let cleanData = data.trim();
        try {
            cleanData = cleanData.replace(/""/g, '"');
            cleanData = cleanData.replace(/\\u([\dA-F]{4})/gi, (_, p1) =>
                String.fromCharCode(parseInt(p1, 16))
            );
        } catch (error) {
            console.error(`Error al limpiar los datos en la línea: "${line}"`, error);
            continue;
        }

        let json;
        try {
            json = JSON.parse(cleanData);
        } catch (error) {
            console.error(`Error al analizar JSON en la línea: "${line}"`, error);
            continue;
        }

        switch (operation) {
            case 'INSERT':
                tree.insertFromJson(json);
                break;
            case 'PATCH':
                tree.patchFromJson(json);
                break;
            case 'DELETE':
                tree.deleteFromJson(json);
                break;
            default:
                console.error(`Operación desconocida: ${operation}`);
        }
    }
}

async function salidatxt(filename: string, tree: Btree): Promise<void> {
    const rl = readline.createInterface({
        input: fs.createReadStream(filename),
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        let trimmedLine = line.trim();
        if (trimmedLine.startsWith('"') && trimmedLine.endsWith('"')) {
            trimmedLine = trimmedLine.slice(1, -1);
        }

        const [operation, data] = trimmedLine.split(';');
        if (!operation || !data) {
            console.error(`Error al analizar la línea: "${line}"`);
            continue;
        }

        let cleanData = data.trim();
        try {
            cleanData = cleanData.replace(/""/g, '"');
            cleanData = cleanData.replace(/\\u([\dA-F]{4})/gi, (_, p1) =>
                String.fromCharCode(parseInt(p1, 16))
            );
        } catch (error) {
            console.error(`Error al limpiar los datos en la línea: "${line}"`, error);
            continue;
        }

        let json;
        try {
            json = JSON.parse(cleanData);
        } catch (error) {
            console.error(`Error al analizar JSON en la línea: "${line}"`, error);
            continue;
        }

        switch (operation) {
            case 'SEARCH':
                const foundBooks = tree.searchByName(json.name);
                if (foundBooks!== null && foundBooks!== undefined) {
                    const bookJson = JSON.stringify(foundBooks) + '\n';
                    fs.appendFile('libros_encontrados.txt', bookJson, (err) => {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log(`Libro encontrado y agregado al archivo`);
                        }
                    });
                } else {
                    const noBookJson = JSON.stringify({ message: `No se encontró ningún libro con el nombre: ${json.name}` }) + '\n';
                    fs.appendFile('libros_encontrados.txt', noBookJson, (err) => {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log(`No se encontró libro, agregado al archivo`);
                        }
                    });
                }
                break;
            default:
                console.error(`Operación desconocida: ${operation}`);
        }
    }

}



const tree = new Btree();
const filePath = 'lab01_books.csv';
const filePath2 = 'lab01_search.csv';

leerCSV(filePath, tree).then(() => {
    console.log('CSV processing completed.');
    return salidatxt(filePath2, tree);
}).then(() => {
    console.log('Search processing completed.');
}).catch((err) => {
    console.error('Error processing files:', err);
});