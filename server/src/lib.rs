use proc_macro::TokenStream;
use quote::{format_ident, quote};
use syn::{Data, DeriveInput, Fields};

#[proc_macro_derive(Subset, attributes(subset_derive, subset_omit))]
pub fn subset_derive_macro(input: TokenStream) -> TokenStream {
    let ast: DeriveInput = syn::parse(input).unwrap();
    let struct_name = &ast.ident;
    let subset_struct_name = &format_ident!("{}Subset", &struct_name);

    match ast.data {
        Data::Struct(data_struct) => match data_struct.fields {
            Fields::Named(named_fields) => {
                let mut subset_struct_def = quote!();
                let mut subset_struct_fields = quote!();
                let (_subset_derive, subset_attrs) =
                    ast.attrs
                        .iter()
                        .fold((quote!(), quote!()), |(tokens, mut attrs), attr| {
                            if attr.path.is_ident("subset_derive") {
                                (attr.tokens.clone(), attrs)
                            } else {
                                // println!("{:#?}", attr.to_string());
                                attrs.extend(quote!(#attr));
                                (tokens, attrs)
                            }
                        });
                for field in named_fields.named.iter() {
                    if let None = field
                        .attrs
                        .iter()
                        .find(|&attr| attr.path.is_ident("subset_omit"))
                    {
                        let key = field.ident.as_ref().unwrap();
                        let fieldtype = &field.ty;

                        subset_struct_def.extend(quote! {
                            #key: &'a #fieldtype,
                        });

                        subset_struct_fields.extend(quote! {
                            #key: &self.#key,
                        });
                    }
                }

                let gen = quote! {
                    #subset_attrs
                    struct #subset_struct_name<'a> {
                        #subset_struct_def
                    }

                    impl<'a> Subsetable<'a, #subset_struct_name<'a>> for #struct_name {
                        fn as_subset(&'a self) -> #subset_struct_name {
                            #subset_struct_name {
                                #subset_struct_fields
                            }
                        }
                    }
                };

                gen.into()
            }
            _ => unimplemented!(),
        },
        _ => unimplemented!(),
    }
}
