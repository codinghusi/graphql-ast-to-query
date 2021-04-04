import { ArgumentNode, BooleanValueNode, DirectiveDefinitionNode, DirectiveNode, DocumentNode, EnumTypeDefinitionNode, EnumTypeExtensionNode, EnumValueDefinitionNode, EnumValueNode, FieldDefinitionNode, FieldNode, FloatValueNode, FragmentDefinitionNode, FragmentSpreadNode, InlineFragmentNode, InputObjectTypeDefinitionNode, InputObjectTypeExtensionNode, InputValueDefinitionNode, InterfaceTypeDefinitionNode, InterfaceTypeExtensionNode, IntValueNode, ListTypeNode, ListValueNode, NamedTypeNode, NameNode, NonNullTypeNode, NullValueNode, ObjectFieldNode, ObjectTypeDefinitionNode, ObjectTypeExtensionNode, ObjectValueNode, OperationDefinitionNode, OperationTypeDefinitionNode, ScalarTypeDefinitionNode, ScalarTypeExtensionNode, SchemaDefinitionNode, SchemaExtensionNode, SelectionSetNode, StringValueNode, UnionTypeDefinitionNode, UnionTypeExtensionNode, VariableDefinitionNode, VariableNode } from "graphql";

// TODO: use description fields

function stringify(value: string | any) {
    if (value) {
        if (typeof(value) === "string" && value.length) {
            return value;
        } else if (typeof(value) === "object") {
            return astToQuery(value);
        } else {
            return value;
        }
    }
    return null;
}

function result(separators: TemplateStringsArray, ...values: (string | any)[]) {
    const results = [];
    const length = values.length;
    values.forEach((value, i) => {
        if (value) {
            const separator = separators[i];
            const val = stringify(value);
            if (val) {
                results.push(separator, val);
                if (i >= length - 1) {
                    results.push(separators[length]);
                }
            }
        }
    });
    return results.join('');
}

function maybe([first, last]: TemplateStringsArray, value: string | any) {
    if (value) {
        const val = stringify(value);
        if (val) {
            return first + val + last;
        }
    }
    return '';
}

function joinThem(asts: Readonly<any[]>, glue: string) {
    return asts?.filter(ast => !!ast).map(astToQuery).join(glue);
}

const wrappers = {
    Document(ast: DocumentNode) {
        return joinThem(ast.definitions, '\n\n');
    },

    StringValue({ value, block }: StringValueNode) {
        if (block) {
            return `"""${value}"""`;
        }
        return `"${value}"`;
    },
    IntValue({ value }: IntValueNode) {
        return `${value}`;
    },
    ListType(ast: ListTypeNode) {
        const type = astToQuery(ast.type);
        return `[${type}]`;
    },
    FloatValue({ value }: FloatValueNode) {
        return value;
    },
    BooleanValue({ value }: BooleanValueNode) {
        return value;
    },
    NullValue(ast: NullValueNode) {
        return null;
    },
    EnumValue({ value }: EnumValueNode) {
        return value;
    },
    ObjectField(ast: ObjectFieldNode) {
        return result`${ast.name}: ${ast.value}`;
    },
    ObjectValue(ast: ObjectValueNode) {
        const fields = joinThem(ast.fields, ', ');
        return `{${fields}}`;
    },

    Name({ value }: NameNode) {
        return value;
    },
    Variable(ast: VariableNode) {
        const name = astToQuery(ast.name)
        return '$' + name;
    },

    NonNullType(ast: NonNullTypeNode) {
        return result`${ast.type}!`;
    },
    NamedType(ast: NamedTypeNode) {
        return result`${ast.name}`;
    },
    
    ScalarTypeDefinition(ast: ScalarTypeDefinitionNode) {
        const directives = joinThem(ast.directives, ' ');
        return result`scalar ${ast.name} ${directives}`;
    },

    ObjectTypeDefinition(ast: ObjectTypeDefinitionNode) {
        const interfaces = joinThem(ast.interfaces, ' & ');
        const directives = joinThem(ast.directives, ' ');
        const fields = joinThem(ast.fields, ', ');
        return result`type ${ast.name} ${interfaces} ${directives} { ${fields} }`;
    },

    InputValueDefinition(ast: InputValueDefinitionNode) {
        const directives = joinThem(ast.directives, ' ');
        return result`${ast.name}: ${ast.type} = ${ast.defaultValue} ${directives}`;
    },

    InputObjectTypeDefinition(ast: InputObjectTypeDefinitionNode) {
        const fields = joinThem(ast.fields, ', ');
        const directives = joinThem(ast.directives, ' ');
        return result`input ${ast.name} ${directives} { ${fields} }`;
    },

    Directive(ast: DirectiveNode) {
        const args = joinThem(ast.arguments, ', ');
        return result`@${ast.name}(${args})`;
    },
    Argument(ast: ArgumentNode) {
        return result`${ast.name}: ${ast.value}`;
    },
    VariableDefinition(ast: VariableDefinitionNode) {
        const directives = joinThem(ast.directives, ' ');
        return result`${ast.variable}: ${ast.type} = ${ast.defaultValue} ${directives}`;
    },

    FragmentSpread(ast: FragmentSpreadNode) {
        const directives = joinThem(ast.directives, ' ');
        return result`...${ast.name} ${directives}`;
    },

    InlineFragment(ast: InlineFragmentNode) {
        const directives = joinThem(ast.directives, ' ')
        return result`... on ${ast.typeCondition} ${directives} ${ast.selectionSet}`;
    },

    SelectionSet(ast: SelectionSetNode) {
        const fields = joinThem(ast.selections, ', ');
        return `{ ${fields} }`;
    },

    OperationDefinition(ast: OperationDefinitionNode) {
        const variables = joinThem(ast.variableDefinitions, ', ');
        return result`${ast.operation} ${ast.name}(${variables})` + astToQuery(ast.selectionSet);
    },

    Field(ast: FieldNode) {
        const args = joinThem(ast.arguments, ', ');
        const directives = joinThem(ast.directives, ' ');
        return result`${ast.alias}: ` + result`${ast.name}(${args})` + result` ${directives} ${ast.selectionSet}`;
    },

    FragmentDefinition(ast: FragmentDefinitionNode) {
        return result`fragment ${ast.name} on ${ast.typeCondition} ${ast.selectionSet}`;
    },

    InterfaceTypeDefinition(ast: InterfaceTypeDefinitionNode) {
        const directives = joinThem(ast.directives, ' ');
        const interfaces = joinThem(ast.interfaces, ' & ');
        const fields = joinThem(ast.fields, ', ');
        return result`interface ${ast.name} ${directives} implements ${interfaces} { ${fields} }`;
    },

    UnionTypeDefinition(ast: UnionTypeDefinitionNode) {
        const directives = joinThem(ast.directives, ' ');
        const types = joinThem(ast.types, ' | ');
        return result`union ${ast.name} ${directives} = ${types}`;
    },

    EnumValueDefinition(ast: EnumValueDefinitionNode) {
        const directives = joinThem(ast.directives, ' ');
        return result`${ast.name} ${directives}`;
    },

    EnumTypeDefinition(ast: EnumTypeDefinitionNode) {
        const directives = joinThem(ast.directives, ' ');
        const values = joinThem(ast.values, ', ');
        return result`enum ${ast.name} ${directives} { ${values} }`;
    },

    DirectiveDefinition(ast: DirectiveDefinitionNode) {
        const args = joinThem(ast.arguments, ', ');
        const locations = joinThem(ast.locations, ' | ');
        const repeatable = ast.repeatable && 'repeatable'
        return result`directive @${ast.name}(${args}) ${repeatable}` + result` on ${locations}`;
    },

    FieldDefinition(ast: FieldDefinitionNode) {
        const args = joinThem(ast.arguments, ', ');
        const directives = joinThem(ast.directives, ' ');
        return result`${ast.name}(${args})` + result`: ${ast.type} ${directives}`;
    },

    ObjectTypeExtension(ast: ObjectTypeExtensionNode) {
        const objType = astToQuery({ ...ast, kind: "ObjectTypeDefinition"});
        return `extend ${objType}`;
    },

    InterfaceTypeExtension(ast: InterfaceTypeExtensionNode) {
        const interfaceType = astToQuery({ ...ast, kind: "InterfaceTypeDefinition"});
        return `extend ${interfaceType}`;
    },

    UnionTypeExtension(ast: UnionTypeExtensionNode) {
        const unionType = astToQuery({ ...ast, kind: "UnionTypeDefinition"});
        return `extend ${unionType}`;
    },

    EnumTypeExtension(ast: EnumTypeExtensionNode) {
        const enumType = astToQuery({ ...ast, kind: "EnumTypeDefinition"});
        return `extend ${enumType}`;
    },
    
    InputObjectTypeExtension(ast: InputObjectTypeExtensionNode) {
        const inputType = astToQuery({ ...ast, kind: "InputObjectTypeDefinition"});
        return `extend ${inputType}`;
    },

    ScalarTypeExtension(ast: ScalarTypeExtensionNode) {
        const scalarType = astToQuery({ ...ast, kind: "ScalarTypeDefinition"});
        return `extend ${scalarType}`;
    },

    SchemaDefinition(ast: SchemaDefinitionNode) {
        const directives = joinThem(ast.directives, ' ');
        const operationTypes = joinThem(ast.operationTypes, ', ');
        return result`${'schema'} ${directives} { ${operationTypes} }`;
    },

    OperationTypeDefinition(ast: OperationTypeDefinitionNode) {
        return result`${ast.operation}: ${ast.type}`;
    },

    SchemaExtension(ast: SchemaExtensionNode) {
        const schemaType = astToQuery({ ...ast, kind: "SchemaDefinition"});
        return `extend ${schemaType}`;
    },
}


export function astToQuery(ast: any) {
    // if is not defined return nothing
    if (!ast) {
        return "";
    }
    // find wrapper
    const { kind } = ast;
    const wrapper = wrappers[kind];
    if (!wrapper) {
        throw `Wrapper for kind '${kind}' not implemented!`;
    }
    
    const result = wrapper(ast);
    return maybe`${ast.description}\n` + result;
}