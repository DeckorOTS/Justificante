(function () {
    "use strict";

    var FormVuAPI = {};

    FormVuAPI.extractFormValues = function () {
        const inputs = document.getElementsByTagName("input");
        const textareas = document.getElementsByTagName("textarea");
        const selects = document.getElementsByTagName("select");

        const texts = [];
        const checks = [];
        const checkGroups = [];
        const radios = [];
        const choices = [];

        for (const inp of inputs) {
            const ref = inp.getAttribute("data-objref");
            if (ref && ref.length > 0) {
                const type = inp.type.toUpperCase();
                if (type === "TEXT" || type === "PASSWORD") {
                    texts.push(inp);
                } else if (type === "CHECKBOX") {
                    // Handle checkbox groups
                    if (Object.keys(idrform.getCheckboxGroup(inp.dataset.fieldName)).length > 1)
                        checkGroups.push(inp);
                    else checks.push(inp);
                } else if (type === "RADIO") {
                    // Filter out unisons
                    if (inp.name === inp.dataset.fieldName) radios.push(inp);
                }
            }
        }
        for (const inp of textareas) {
            const ref = inp.getAttribute("data-objref");
            if (ref && ref.length > 0) {
                texts.push(inp);
            }
        }
        for (const inp of selects) {
            const ref = inp.getAttribute("data-objref");
            if (ref && ref.length > 0) {
                choices.push(inp);
            }
        }

        const output = {};

        for (const item of texts) {
            const fieldText = item.value;
            const fieldName = item.getAttribute("data-field-name");
            output[fieldName] = fieldText;
        }

        for (const item of checkGroups) {
            const fieldName = item.getAttribute("data-field-name");
            const isChecked = item.checked;
            const value = item.value

            if (isChecked) {
                output[fieldName] = value;
            }
        }

        for (const item of checks) {
            const isChecked = item.checked;
            const fieldName = item.getAttribute("data-field-name");
            output[fieldName] = isChecked;
        }

        for (const item of choices) {
            const selected = item.value;
            const fieldName = item.getAttribute("data-field-name");
            output[fieldName] = selected;
        }

        for (const radio of radios) {
            const fieldName = radio.getAttribute("data-field-name");
            const isChecked = radio.checked;
            const value = radio.value;

            if (isChecked) {
                output[fieldName] = value;
            }
        }
        return output;
    };

    let setRequestEventHandlers = function(xhr, params) {
        xhr.onreadystatechange = function(event) {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    if (params.success) {
                        params.success(event);
                    }
                } else {
                    if (params.failure) {
                        params.failure(event);
                    } else {
                        console.log(event.target.response);
                    }
                }
            }
        };
    };

    FormVuAPI.submitFormAsMail = function(params) {
        if (typeof params !== 'object') {
            params = {url: params};
        }
        if (!params.url.startsWith('mailto:')) {
            return;
        }
        switch (params.format) {
            case 'formdata':
                alert('The file will be saved in your machine, please attach it to the email');
                downloadFormDataValues(this.extractFormValues());
                openMailToLink(params.url);
                break;
            case 'pdf':
                alert('The file will be saved in your machine, please attach it to the email');
                idrform.app.execMenuItem('SaveAs');
                openMailToLink(params.url);
                break;
            default:
                alert('Unsupported submission format. Submission failed.');
                break;
        }
    };

    let downloadFormDataValues = function(formValues) {
        let formValuesString = "";
        for (var value in formValues) {
            if (formValues.hasOwnProperty(value) && formValues[value] !== undefined) {
                if (formValuesString.length !== 0) {
                    formValuesString += '&';
                }

                formValuesString += encodeURIComponent(value) + '=' + formValues[value];
            }
        }
        let fileDL = document.createElement('a');
        let pdfName = document.getElementById("FDFXFA_PDFName").textContent;
        fileDL.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(formValuesString));
        fileDL.setAttribute('download', pdfName + '.txt');
        fileDL.style.display = 'none';
        document.body.appendChild(fileDL);
        fileDL.click();
        document.body.removeChild(fileDL);
    };

    let openMailToLink = function(target) {
        let mailto = document.createElement('a');
        mailto.setAttribute('href', target);
        mailto.setAttribute('target', "_blank");
        mailto.style.display = 'none';
        document.body.appendChild(mailto);
        mailto.click();
        document.body.removeChild(mailto);
    };

    FormVuAPI.submitFormAsJSON = function (params) {
        let url = typeof params === 'object' ? params.url : params;

        let formValues = {data: this.extractFormValues()};
        let xhr = new XMLHttpRequest();
        if (xhr.upload) {
            setRequestEventHandlers(xhr, params);
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.send(JSON.stringify(formValues));
            return xhr;
        }
    };

    FormVuAPI.submitFormAsFormData = function (params) {
        let url = typeof params === 'object' ? params.url : params;

        let formValues = this.extractFormValues();
        let xhr = new XMLHttpRequest();
        if (xhr.upload) {
            setRequestEventHandlers(xhr, params);
            xhr.open('POST', url, true);

            let formData = new FormData();
            for (var value in formValues) {
                if (formValues.hasOwnProperty(value) && formValues[value] !== undefined) {
                    formData.append(encodeURIComponent(value), formValues[value]);
                }
            }
            xhr.send(formData);
            return xhr;
        }
    };

    FormVuAPI.submitFormAsPDF = function (params) {
        let url, submitType="formData";
        if (typeof params === 'object') {
            url = params.url;
            submitType = params.submitType || "formData";
        } else {
            url = params;
        }

        const xhr = new XMLHttpRequest();
        if (xhr.upload) {
            setRequestEventHandlers(xhr, params);
            xhr.open('POST', url, true);
            const file = idrform.getCompletedFormPDF();
            const fileName = document.querySelector("#FDFXFA_PDFName").textContent;

            if (submitType === "raw") {
                xhr.setRequestHeader("Content-Disposition", `filename="${fileName}"`)
                xhr.send(file);
            } else if (submitType === "formData") {
                const formData = new FormData();
                formData.append("file", file, fileName);
                xhr.send(formData);
            }
            return xhr;
        }
    }

    window.FormVuAPI = FormVuAPI;

}());