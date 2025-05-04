
export default (() => {
    
    const button = document.querySelector("#counter") as HTMLButtonElement;
    const counter = document.querySelector("#number") as HTMLElement;
    let count = 0;
    button.addEventListener('click', () => {
        count += 1;
        counter.textContent = `${count}`;
    });

})();