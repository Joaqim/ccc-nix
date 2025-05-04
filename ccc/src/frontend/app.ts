

export default (() => {
    
    const button = document.querySelector("#button") as HTMLButtonElement;
    const counter = document.querySelector("#counter") as HTMLElement;
    let count = 0;
    button.addEventListener('click', () => {
        count += 1;
        counter.textContent = `${count}`;
    });

})();