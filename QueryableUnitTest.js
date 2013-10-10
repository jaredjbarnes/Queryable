describe("Observable", function(){
    it("We will observe, notify and unobserve, then notify again to ensure that we unobserved.", function(){
        var count = 0;
        
        var observable = new BoostJS.Observable();
            var callback = function(){
                count++;    
            };
            observable.observe("name", callback);
            observable.notify({type: "name"});
            observable.unobserve("name", callback);
            observable.notify({type: "name"});
        
        runs(function(){
            expect(count).toBe(1);
        });
    });    
});

describe("Futures Result", function(){
    it("Should create a future with a setTimeout of 200 ms, and returns a value of \"true\".", function(){
      
        var asyncFinished = false;
        
        var future = new BoostJS.Future(function(setValue, setError){
            setTimeout(function(){
                setValue(true);
            },200);   
        });
        
        future.then(function(){
            asyncFinished = true;
        });
        
        waitsFor(function(){
            return asyncFinished === true;    
        },"Future should equal true."); 
    
        runs(function(){
            expect(future.value).toBe(true);
        });
    });    
});




describe("Futures Cancel", function(){
    it("Should create a future, and then cancel it.", function(){
      
        var asyncFinished = false;
        
        var future = new BoostJS.Future(function(setValue, setError){
            setTimeout(function(){
                setValue(true);
            },200);   
        });
        
        future.then(function(){
            
        }).ifCanceled(function(){
            
        }).ifError(function(){
              
        }).cancel();
        
        setTimeout(function(){
            asyncFinished = true;
        }, 300);
        
        waitsFor(function(){
            return asyncFinished === true;    
        },"Future should be canceled."); 
    
        runs(function(){
            expect(future.value).toBeNull();
            expect(future.error).toBeNull();
            expect(future.isComplete).toBe(true);
        });
    });    
});

describe("Futures Error", function(){
    it("Should create a future that returns an error.", function(){
      
        var asyncFinished = false;
        var calledCallback = false;
        
        var error = new Error("Test error.");
        
        var future = new BoostJS.Future(function(setValue, setError){
            setTimeout(function(){
                setError(error);
            },200);   
        });
        
        future.then(function(){
            
        }).ifCanceled(function(){
            
        }).ifError(function(){
            calledCallback = true;
        });
        
        setTimeout(function(){
            asyncFinished = true;
        }, 300);
        
        waitsFor(function(){
            return asyncFinished === true;    
        },"Future should be canceled."); 
    
        runs(function(){
            expect(future.value).toBeNull();
            expect(future.error).toBe(error);
            expect(calledCallback).toBe(true);
            expect(future.isComplete).toBe(true);
        });
    });    
});


describe("Expressions Value inheritance.", function(){
    it("ValueExpression should be an instance of Expression.", function(){
      
        var exp = BoostJS.Expression.boolean(true);
      
        runs(function(){
            expect(exp instanceof BoostJS.Expression).toBe(true);
        });
        
    });    
});

describe("Expressions Complex inheritance.", function(){
    it("ComplexExpression should be an instance of Expression.", function(){
      
        var exp = BoostJS.Expression.where(true);
      
        runs(function(){
            expect(exp instanceof BoostJS.Expression).toBe(true);
        });
        
    });    
});

describe("Expression value casts.", function(){

    it("This should test all primitive type casts.", function(){
        runs(function(){
            var nullExpression = BoostJS.Expression.getExpressionType(null);
            var booleanExpression = BoostJS.Expression.getExpressionType(true);
            var undefinedExpression = BoostJS.Expression.getExpressionType(undefined);
            var dateExpression = BoostJS.Expression.getExpressionType(new Date());
            var objectExpression = BoostJS.Expression.getExpressionType({});
            var arrayExpression = BoostJS.Expression.getExpressionType([]);
            var functionExpression = BoostJS.Expression.getExpressionType(function(){});
            var numberExpression = BoostJS.Expression.getExpressionType(0);
            var stringExpression = BoostJS.Expression.getExpressionType("string");
            
            expect(nullExpression.name).toEqual("null");    
            expect(booleanExpression.name).toEqual("boolean");    
            expect(undefinedExpression.name).toEqual("undefined");    
            expect(dateExpression.name).toEqual("date");    
            expect(objectExpression.name).toEqual("object");    
            expect(arrayExpression.name).toEqual("array");    
            expect(functionExpression.name).toEqual("function");    
            expect(numberExpression.name).toEqual("number");    
            expect(stringExpression.name).toEqual("string");    
        });
    });
    
});

describe("Equals expression.", function(){

    it("We pass two primitives to an equals Expression, and then check the tree.", function(){
        runs(function(){
            
            var equals = BoostJS.Expression.equal(BoostJS.Expression.property("propertyName"), BoostJS.Expression.getExpressionType(true));
            
            expect(equals.children[0].name).toEqual("property");
            expect(equals.children[1].name).toEqual("boolean");
            expect(equals.children[0].value).toEqual("propertyName");
            expect(equals.children[1].value).toEqual(true);
        });
    });
    
});

describe("GreaterThan expression.", function(){

    it("We pass two primitives to an greaterThan Expression, and then check the tree.", function(){
        runs(function(){
            
            var greaterThan = BoostJS.Expression.greaterThan(BoostJS.Expression.property("propertyName"), BoostJS.Expression.getExpressionType(0));
            
            expect(greaterThan.children[0].name).toEqual("property");
            expect(greaterThan.children[1].name).toEqual("number");
            expect(greaterThan.children[0].value).toEqual("propertyName");
            expect(greaterThan.children[1].value).toEqual(0);
        });
    });
    
});

describe("LessThan expression.", function(){

    it("We pass two primitives to an lessThan Expression, and then check the tree.", function(){
        runs(function(){
            
            var lessThan = BoostJS.Expression.lessThan(BoostJS.Expression.property("propertyName"), BoostJS.Expression.getExpressionType(0));
            
            expect(lessThan.children[0].name).toEqual("property");
            expect(lessThan.children[1].name).toEqual("number");
            expect(lessThan.children[0].value).toEqual("propertyName");
            expect(lessThan.children[1].value).toEqual(0);
        });
    });
    
});

describe("GreaterThanOrEqual expression.", function(){

    it("We pass two primitives to an greaterThanOrEqual Expression, and then check the tree.", function(){
        runs(function(){
            
            var greaterThanOrEqual = BoostJS.Expression.greaterThanOrEqual(BoostJS.Expression.property("propertyName"), BoostJS.Expression.getExpressionType(0));
            
            expect(greaterThanOrEqual.children[0].name).toEqual("property");
            expect(greaterThanOrEqual.children[1].name).toEqual("number");
            expect(greaterThanOrEqual.children[0].value).toEqual("propertyName");
            expect(greaterThanOrEqual.children[1].value).toEqual(0);
        });
    });
    
});

describe("LessThanOrEqual expression.", function(){

    it("We pass two primitives to an lessThanOrEqual Expression, and then check the tree.", function(){
        runs(function(){
            
            var lessThanOrEqual = BoostJS.Expression.lessThanOrEqual(BoostJS.Expression.property("propertyName"), BoostJS.Expression.getExpressionType(0));
            
            expect(lessThanOrEqual.children[0].name).toEqual("property");
            expect(lessThanOrEqual.children[1].name).toEqual("number");
            expect(lessThanOrEqual.children[0].value).toEqual("propertyName");
            expect(lessThanOrEqual.children[1].value).toEqual(0);
        });
    });
    
});


describe("OrderBy expression.", function(){

    it("We build a orderBy tree with a descending, and an ascending expression.", function(){
        runs(function(){
            
            var orderBy = BoostJS.Expression.orderBy(BoostJS.Expression.descending(BoostJS.Expression.property("propertyName")), BoostJS.Expression.ascending(BoostJS.Expression.property("propertyName1")));
            
            expect(orderBy.children[0].name).toEqual("descending");
            expect(orderBy.children[1].name).toEqual("ascending");
            expect(orderBy.children[0].children[0].name).toEqual("property");
            expect(orderBy.children[1].children[0].name).toEqual("property");
            expect(orderBy.children[0].children[0].value).toEqual("propertyName");
            expect(orderBy.children[1].children[0].value).toEqual("propertyName1");
        });
    });
    
});

describe("Skip method expression.", function(){

    it("We skip 2.", function(){
        runs(function(){
            
            var skip = BoostJS.Expression.skip(BoostJS.Expression.getExpressionType(2));
            
            expect(skip.children[0].name).toEqual("number");
            expect(skip.children[0].value).toEqual(2);
        });
    });
    
});


describe("Take method expression.", function(){

    it("We will take 5.", function(){
        runs(function(){
            
            var take = BoostJS.Expression.take(BoostJS.Expression.getExpressionType(5));
            
            expect(take.children[0].name).toEqual("number");
            expect(take.children[0].value).toEqual(5);
        });
    });
    
});

describe("ToGuid method expression.", function(){

    it("We will make a guid.", function(){
        runs(function(){
           
            var guid = BoostJS.Expression.toGuid(BoostJS.Expression.getExpressionType("12sl3cl3-0dkdl"));
            
            expect(guid.children[0].name).toEqual("string");
            expect(guid.children[0].value).toEqual("12sl3cl3-0dkdl");
        });
    });
    
});

describe("Substring method expression.", function(){

    it("We will make a substring method with \"arn\" as the argument.", function(){
        runs(function(){
           
            var substring = BoostJS.Expression.substring(BoostJS.Expression.property("firstName"), BoostJS.Expression.getExpressionType("arn"));
            
            expect(substring.children[0].name).toEqual("property");
            expect(substring.children[0].value).toEqual("firstName");
            
            expect(substring.children[1].name).toEqual("string");
            expect(substring.children[1].value).toEqual("arn");
        });
    });
    
});

describe("SubstringOf method expression.", function(){

    it("We will make a substringOf method with \"are\" as the argument.", function(){
        runs(function(){
           
            var substringOf = BoostJS.Expression.substringOf(BoostJS.Expression.property("firstName"), BoostJS.Expression.getExpressionType("are"));
            
            expect(substringOf.children[0].name).toEqual("property");
            expect(substringOf.children[0].value).toEqual("firstName");
            
            expect(substringOf.children[1].name).toEqual("string");
            expect(substringOf.children[1].value).toEqual("are");
        });
    });
    
});

describe("StartsWith method expression.", function(){

    it("We will make a startsWith method with \"Jar\" as the argument.", function(){
        runs(function(){
           
            var startsWith = BoostJS.Expression.startsWith(BoostJS.Expression.property("firstName"), BoostJS.Expression.getExpressionType("Jar"));
            
            expect(startsWith.children[0].name).toEqual("property");
            expect(startsWith.children[0].value).toEqual("firstName");
            
            expect(startsWith.children[1].name).toEqual("string");
            expect(startsWith.children[1].value).toEqual("Jar");
        });
    });
    
});

describe("EndsWiths method expression.", function(){

    it("We will make a endsWith method with \"red\" as the argument.", function(){
        runs(function(){
           
            var endsWith = BoostJS.Expression.endsWith(BoostJS.Expression.property("firstName"), BoostJS.Expression.getExpressionType("red"));
            
            expect(endsWith.children[0].name).toEqual("property");
            expect(endsWith.children[0].value).toEqual("firstName");
            
            expect(endsWith.children[1].name).toEqual("string");
            expect(endsWith.children[1].value).toEqual("red");
        });
    });
    
});

describe("ExpressionBuilder", function(){

    it("Create a Expression tree through expression builder of type Person, and test equals.", function(){
        runs(function(){
           
            var Person = function(){
                this.firstName = null;
                this.lastName = null;
                this.age = null;
            };
           
            var expressionBuilder = new BoostJS.ExpressionBuilder(Person);
            var exp = expressionBuilder.firstName.equals("Jared");
            
            expect(exp.name).toEqual("equal");
            expect(exp.children[0].name).toEqual("property");
            expect(exp.children[0].value).toEqual("firstName");
            expect(exp.children[1].name).toEqual("string");
            expect(exp.children[1].value).toEqual("Jared");
            
        });
    });
    
});

describe("ExpressionBuilder", function(){

    it("Create a Expression tree through expression builder of type Person, and test greaterThan.", function(){
        runs(function(){
           
            var Person = function(){
                this.firstName = null;
                this.lastName = null;
                this.age = null;
            };
           
            var expressionBuilder = new BoostJS.ExpressionBuilder(Person);
            var exp = expressionBuilder.age.greaterThan(0);
            
            expect(exp.name).toEqual("greaterThan");
            expect(exp.children[0].name).toEqual("property");
            expect(exp.children[0].value).toEqual("age");
            expect(exp.children[1].name).toEqual("number");
            expect(exp.children[1].value).toEqual(0);
            
        });
    });
    
});

describe("ExpressionBuilder", function(){

    it("Create a Expression tree through expression builder of type Person, and test lessThan.", function(){
        runs(function(){
           
            var Person = function(){
                this.firstName = null;
                this.lastName = null;
                this.age = null;
            };
           
            var expressionBuilder = new BoostJS.ExpressionBuilder(Person);
            var exp = expressionBuilder.age.lessThan(0);

            expect(exp.name).toEqual("lessThan");
            expect(exp.children[0].name).toEqual("property");
            expect(exp.children[0].value).toEqual("age");
            expect(exp.children[1].name).toEqual("number");
            expect(exp.children[1].value).toEqual(0);
            
        });
    });
    
});


describe("ExpressionBuilder", function(){

    it("Create a Expression tree through expression builder of type Person, and test greaterThanOrEqualTo.", function(){
        runs(function(){
           
            var Person = function(){
                this.firstName = null;
                this.lastName = null;
                this.age = null;
            };
           
            var expressionBuilder = new BoostJS.ExpressionBuilder(Person);
            var exp = expressionBuilder.age.greaterThanOrEqualTo(0);

            expect(exp.name).toEqual("greaterThanOrEqual");
            expect(exp.children[0].name).toEqual("property");
            expect(exp.children[0].value).toEqual("age");
            expect(exp.children[1].name).toEqual("number");
            expect(exp.children[1].value).toEqual(0);
            
        });
    });
    
});

describe("ExpressionBuilder", function(){

    it("Create a Expression tree through expression builder of type Person, and test lessThanOrEqualTo.", function(){
        runs(function(){
           
            var Person = function(){
                this.firstName = null;
                this.lastName = null;
                this.age = null;
            };
           
            var expressionBuilder = new BoostJS.ExpressionBuilder(Person);
            var exp = expressionBuilder.age.lessThanOrEqualTo(0);

            expect(exp.name).toEqual("lessThanOrEqual");
            expect(exp.children[0].name).toEqual("property");
            expect(exp.children[0].value).toEqual("age");
            expect(exp.children[1].name).toEqual("number");
            expect(exp.children[1].value).toEqual(0);
            
        });
    });
    
});

describe("Queryable", function(){

    it("Create a Queryable of Type Person, and use a equals with a take, and skip 1.", function(){
        runs(function(){
           
            var Person = function(){
                this.firstName = null;
                this.lastName = null;
                this.age = null;
            };
           
            var queryable = new BoostJS.Queryable(Person).where(function(p){
                return p.firstName.equals("Jared");    
            }).take(5).skip(1).orderBy(function(p){
                return p.lastName;
            });

            var expression = queryable.expression;
            
            expect(expression.where.name).toEqual("where");
            
            expect(expression.skip.children[0].value).toEqual(1);
            expect(expression.skip.children[0].name).toEqual("number");
            
            expect(expression.take.children[0].name).toEqual("number");
            expect(expression.take.children[0].value).toEqual(5);
            
            expect(expression.orderBy.children[0].name).toEqual("ascending");
            expect(expression.orderBy.children[0].children[0].name).toEqual("property");
            expect(expression.orderBy.children[0].children[0].value).toEqual("lastName");
            
        });
    });
    
});


describe("Odata", function(){

    it("Convert a queryable to a odata string.", function(){
        runs(function(){
           
            var Person = function(){
                this.firstName = null;
                this.lastName = null;
                this.age = null;
            };
           
            var queryable = new BoostJS.Queryable(Person).where(function(p){
                return this.or( p.firstName.equals("Jared"), p.lastName.equals("Barnes") );    
            }).take(5).skip(1).orderBy(function(p){
                return p.lastName;
            }).orderByDesc(function(p){
                return p.age;
            });
            
            var odataString = BoostJS.odata.toString(queryable);
            
            expect(odataString).toEqual("&$filter=(((FirstName eq 'Jared') or (LastName eq 'Barnes'))) &$orderby=LastName asc, Age desc &$skip=1 &$top=5");
            
        });
    });
    
});

describe("ArrayQueryVisitor", function(){

    it("Create a queryable to test ArrayQueryVisitor, filter and check.", function(){
        runs(function(){
           
            var Person = function(){
                this.firstName = null;
                this.lastName = null;
                this.age = null;
            };
           
            var queryable = new BoostJS.Queryable(Person).where(function(p){
                return this.or( p.firstName.equals("Jared"), p.lastName.equals("Barnes") );    
            }).take(5).skip(1).orderBy(function(p){
                return p.lastName;
            }).orderByDesc(function(p){
                return p.age;
            });
            
            var jaredBarnes = new Person();
            jaredBarnes.firstName = "Jared";
            jaredBarnes.lastName = "Barnes";
            jaredBarnes.age = 31;
            
            var jaredJohn = new Person();
            jaredJohn.firstName = "Jared";
            jaredJohn.lastName = "John";
            jaredJohn.age = 50;
            
            var justinBarnes = new Person();
            justinBarnes.firstName = "Justin";
            justinBarnes.lastName = "Barnes";
            justinBarnes.age = 33;
            
            var array = [jaredBarnes, jaredJohn, justinBarnes];
            
            var arrayVisitor = new BoostJS.ArrayQueryVisitor(array);
            
            var parser = new BoostJS.ExpressionParser(arrayVisitor);
            
            parser.parse(queryable.expression.where);
            parser.parse(queryable.expression.take);
            parser.parse(queryable.expression.skip);
            parser.parse(queryable.expression.orderBy);
            
            expect(arrayVisitor.value[0]).toEqual(justinBarnes);
            expect(arrayVisitor.value[1]).toEqual(jaredJohn);
            
        });
    });
    
});

describe("ArrayProvider", function(){

    it("Create a queryable with an array and calling asQueryable, filter and check.", function(){
        
        var Person = function(){
            this.firstName = null;
            this.lastName = null;
            this.age = null;
        };

        var jaredBarnes = new Person();
        jaredBarnes.firstName = "Jared";
        jaredBarnes.lastName = "Barnes";
        jaredBarnes.age = 31;
        
        var jaredJohn = new Person();
        jaredJohn.firstName = "Jared";
        jaredJohn.lastName = "John";
        jaredJohn.age = 50;
        
        var justinBarnes = new Person();
        justinBarnes.firstName = "Justin";
        justinBarnes.lastName = "Barnes";
        justinBarnes.age = 33;
        
        var array = [jaredBarnes, jaredJohn, justinBarnes];
        
        var result;
        
        var queryable = array.asQueryable(Person).where(function(p){
            return this.or( p.firstName.equals("Jared"), p.lastName.equals("John") );    
        }).take(5).orderBy(function(p){
            return p.lastName;
        }).orderByDesc(function(p){
            return p.age;
        }).toArray().then(function(resultArray){
            result = resultArray;
            done = true;
        });
        
        var done = false;
        
        waitsFor(function(){
            return done;
        });
        
        runs(function(){
            expect(result[0]).toEqual(jaredBarnes);
            expect(result[1]).toEqual(jaredJohn);
        });
    });
    
});









var jasmineEnv = jasmine.getEnv();

var htmlReporter = new jasmine.HtmlReporter();
jasmineEnv.addReporter(htmlReporter);

jasmineEnv.specFilter = function(spec) {
    return htmlReporter.specFilter(spec);
};
  
var currentWindowOnload = window.onload;
window.onload = function() {
  if (currentWindowOnload) {
    currentWindowOnload();
  }

  //document.querySelector('.version').innerHTML = jasmineEnv.versionString();
  execJasmine();
};

function execJasmine() {
  jasmineEnv.execute();
}