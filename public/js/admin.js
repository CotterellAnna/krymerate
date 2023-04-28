
$(document).ready(() => {
    let formattedData

    function add(num1, num2){
        let sum = Number(num1) + Number (num2);
        return sum;
    };
    
    // function to populate the datatable with the api data
    function populateTable(data){
        formattedData = data.map(item => {
            return{
                id: item._id,
                name: item.name,
                type: item.type,
                total_crimes_committed: item.crime_info.total_crimes_committed,
                crimes: item.crime_info.crimes,
                last_modified: item.last_modified

            }
        })

        $('#table').DataTable({
            data: formattedData,
            columns: [
                // { data: 'id' },
                { data: 'name' },
                { data: 'type' },
                { data: 'total_crimes_committed' },
                { 
                    data: 'crimes',
                    render: function (data, type, row) {
                      // create a select element with options for each crime
                      var select = '<select>';
                      for (var i = 0; i < data.length; i++) {
                        var crime = data[i];
                        select += '<option value="' + crime.type + '">' + crime.type + ' (' + crime.count + ')</option>';
                      }
                      select += '</select>';
                      return select;
                    }
                },
                {data: 'last_modified'},
                {
                    data: null,
                    render: function (data, type, row) {
                      // create the Edit and Delete buttons
                      return '<button class="btn btn-primary edit-btn me-1" data-bs-toggle="modal" data-bs-target="#form_modal" data-id="' + data.id + '">Edit</button>' +
                             '<button class="btn btn-danger delete-btn" data-id="' + data.id + '">Delete</button>';
                    }
                }
            ]
        });
    }

    fetch("/locations")
        .then((res)=>{
            return res.json();
        })
        .then((data)=>{
            $('#table_loader').hide();
            populateTable(data);
        })
    
    // populate form fields and display modal
    $('#table').on( 'click', '.edit-btn', function (){
        $("#view_edit_form").html("");
        $('#edit_form_loader').show();
        const location_id = $(this).attr("data-id");
        fetch(`/location_id/${location_id}`)
            .then(res=>{
                return res.json()
            })
            .then(data=>{
                $('#edit_form_loader').hide();
                let location_name = data.name;
                let location_type = data.type;
                let population = data.population;
                let crimes = data.crime_info.crimes;
                $("#view_edit_form").append(`
                    <div class="mb-3 col-12">
                        <label for="location_id" class="form-label">ID:</label>
                        <input type="text" class="form-control" id="location_id" placeholder="" value="${location_id}" readonly>
                    </div>
                    <div class="mb-3 col-4">
                        <label for="location_name" class="form-label">Location Name:</label>
                        <input type="text" class="form-control" id="location_name" placeholder="" value="${location_name}" readonly>
                    </div>
                    <div class="mb-3 col-4">
                        <label for="location_type" class="form-label">Type:</label>
                        <input type="text" class="form-control" id="location_type" placeholder="" value="${location_type}" readonly>
                    </div>
                    <div class="mb-3 col-4">
                        <label for="population" class="form-label">Population:</label>
                        <input type="number" class="form-control" id="population" placeholder="" value=${population}>
                    </div>
                    <div class="mb-0 crimes">
                        
                    </div>
                    <div class="mb-0 col-12">
                        <div class="row justify-content-center">
                            <button type="button" class="btn btn-secondary col-4 me-2" data-bs-dismiss="modal">Close</button>
                            <button type="submit" class="btn btn-primary col-4">Submit</button>
                        </div>
                    </div>
                `)
                crimes.forEach(crime=>{
                    const crime_id = crime.type.replace(/\s+/g,'_')
                    $("#view_edit_form .crimes").append(`
                        <div class="mb-3 col-12">
                            <div class="row">
                                <div class="col-12">
                                    <label for="${crime_id}_add" class="form-label">${crime.type}:</label>
                                </div>

                                <div class="col-3">
                                    <input type="number" class="col-4 form-control" id="${crime_id}_add" placeholder="" value="0">
                                </div>

                                <div class="col-1 text-center">
                                    +
                                </div>

                                <div class="col-3">
                                    <input type="text" class="col-4 form-control" id="${crime_id}_old" value="${crime.count}" readonly>
                                </div>

                                <div class="col-1 text-center">
                                    =
                                </div>

                                <div class="col-4">
                                    <input type="text" class="col-4 form-control crime_total" id="${crime_id}" value="${crime.count}" readonly>
                                </div>
                            </div>
                        </div>
                    `)

                    // add the value of new committed crimes to the previous value on input of new committed crimes
                    $("body").on("input", `#${crime_id}_add`, function(){
                        let sum = add($(`#${crime_id}_add`).val(), $(`#${crime_id}_old`).val());
                        $(`#${crime_id}`).val(sum)
                    })
                })

                // add new crime button
                $(`<button type="button" class="btn btn-primary col-auto float-start mx-3 mb-3 add_crime_btn">Add new crime</button><hr>`).insertAfter(`#view_edit_form .crimes`)
            })
            .catch(err=>{
                console.log(err);
            })
    })

    // add new crime row
    $('body').on('click', '.add_crime_btn', function(){
        const new_crime = `
        <div class="mb-3 col-12 new_crime">
            <div class="row">
                <div class="col-3">
                    <input type="text" class="col-4 form-control new_crime_name" placeholder="Crime name">
                </div>
                <div class="col-1 text-center">
                    :
                </div>
                <div class="col-3">
                    <input type="number" class="col-4 form-control crime_total" placeholder="Crime count">
                </div>
                <div class="col-2">
                    
                </div>
                <div class="col-3">
                    <button type="button" class="delete_crime_btn btn btn-danger float-end">Delete</button>
                </div>
            </div>
        </div>
        `
        // add the new crime container to the crimes container
        let crime_container = $(this).prev()
        $(new_crime).appendTo(crime_container);
    })

    // change the id of .crime_total on input
    $('body').on('input', '.new_crime_name', function(){
        $(this).parent().next().next().find('.crime_total').attr('id', $(this).val().replace(/\s+/g,'_'));
    })

    // delete a crime row
    $('body').on('click', '.delete_crime_btn', function(){
        $(this).parents('.new_crime').remove()
    })

    // update record in db on submit of form
    $('#view_edit_form').on('submit', function(e){
        e.preventDefault();
        let id = $(`#view_edit_form #location_id`).val()
        const updatedData = {
            population: $('#population').val(),
            crime_info:{
                crimes: []
            }
        };

        // const crime_totals = $('#view_edit_form .crime_total');
        $('#view_edit_form .crime_total').each(function(){
            const crime_type = $(this).attr('id').replace(/_/g, ' ');
            const crime_count = $(this).val();
            updatedData.crime_info.crimes.push({
                type: crime_type, 
                count: crime_count
            })
        });

        fetch(`/location_id/${id}`, {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
            })
            .then(res => res.json())
            .then(data=>{
                if(data.name){
                    $("#view_edit_form").html("");
                    swal({
                        title: "Great!",
                        text: "Updated record successfully!",
                        icon: "success",
                    }); 
                    $('#table_loader').show()
                    // let close_btn = document.getElementById
                    $('.btn-close').trigger('click');
                    fetch("/locations")
                        .then(res=> res.json())
                        .then(data=>{
                            $('#table_loader').hide()
                            formattedData = data.map(item => {
                                return{
                                    // id: item._id,
                                    name: item.name,
                                    type: item.type,
                                    total_crimes_committed: item.crime_info.total_crimes_committed,
                                    crimes: item.crime_info.crimes,
                                    last_modified: item.last_modified
                    
                                }
                            })
                            $('#table').DataTable().clear().rows.add(formattedData).draw()
                        })
                }
            })
            .catch(err=>{console.log(err)});
    })

    // delete record
    $('#table').on('click', '.delete-btn', function(){
        var row = $(this).closest('tr');

        swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to recover it!",
            icon: "warning",
            buttons: ["No", "Yes"],
            dangerMode: true
        })
            .then((res)=>{
                if(res){
                    let id = $(this).attr('data-id');
                    fetch(`/location_id/${id}`, {
                        method:"DELETE"
                    })
                    .then(res=>{return res.json()})
                    .then(data=>{
                        if(data.name){
                            $('#table').DataTable().row(row).remove().draw();
                            swal({
                                title: "Success",
                                text: "Record has been deleted successfully.",
                                icon: "success"
                            })
                        }
                    }) 
                        
                }
            })
    })

    // add new record
    $('#new_record_form').on('submit', function(e){
        e.preventDefault();

        let new_record = {
            name: $(locationName).val(),
            type: $(locationType).val(),
            population: $(locationPopulation).val(),
            crime_info:{
                crimes: []
            }
        };

        $('#new_record_form .crime_total').each(function(){
            const crime_type = $(this).attr('id').replace(/_/g, ' ');
            const crime_count = $(this).val();
            new_record.crime_info.crimes.push({
                type: crime_type, 
                count: crime_count
            });
        });
        
        $('#table_loader').show();

        fetch('/locations', {
            method:'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(new_record)
            })
            .then(res => res.json())
            .then(data=>{
                $('#table_loader').hide()
                if(data.message == "Location record created successfully"){
                    swal({
                        title: "Great!",
                        text: "Record created successfully!",
                        icon: "success",
                    }); 
                    $('.btn-close').trigger('click');
                    fetch("/locations")
                        .then(res=> res.json())
                        .then(data=>{
                            formattedData = data.map(item => {
                                return{
                                    // id: item._id,
                                    name: item.name,
                                    type: item.type,
                                    total_crimes_committed: item.crime_info.total_crimes_committed,
                                    crimes: item.crime_info.crimes,
                                    last_modified: item.last_modified
                    
                                }
                            })
                            $('#table').DataTable().clear().rows.add(formattedData).draw()
                        })
                }
            })
            .catch(err=>{console.log(err)});
    })

    // logout btn
    $('#logout_btn').click(function(){
        fetch('/admin/logout',{
            method: 'GET'
        })
    })
});