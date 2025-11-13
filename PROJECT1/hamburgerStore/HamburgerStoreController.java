package hamburgerStore;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class HamburgerStoreController {

   private LocalDateTime now = LocalDateTime.now();
   
   public void mainMenu() throws IOException {

      Scanner scan = new Scanner(System.in);

      List<Ingredient> ingredientList = new ArrayList<>();

      String filePath = "ingredient.txt"; // 재료 파일 경로
      
      // 데이터 로드
      try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
         String line;
         while ((line = br.readLine()) != null) {
            String[] data = line.split(";");
            String name = data[0]; // 재료명
            int stock = Integer.parseInt(data[1]); // 재고
            int cost = Integer.parseInt(data[2]); // 구매 원가
            int sale = Integer.parseInt(data[3]); // 판매가
            int count = Integer.parseInt(data[4]); // 재고
            int saleCount = Integer.parseInt(data[5]); // 판매 갯수
            int kind = Integer.parseInt(data[6]); // 1.재료, 2.음료수
            Ingredient ingredient = new Ingredient(name, stock, cost, sale, count, saleCount, kind);
            ingredientList.add(ingredient);
         }
      } catch (IOException e) {
         System.err.println("파일 로드 오류");
      } catch (ArrayIndexOutOfBoundsException e) {
         System.err.println("파일 데이터 형식 오류");
      }
      
      while (true) {
         System.out.println("=====햄버거 키오스크=====");
         System.out.println("주문하기");
         String input = scan.nextLine();

         if (input.equals("99")) {
            
            Manager manager = new Manager();
            manager.managerMain(scan, ingredientList, now);
            
         } else if (input.equals("100")){
            for(int i = 0; i < 30; i++) {
               now = now.plusDays(1);
               Manager manager = new Manager();
               Customer customer = new Customer();
               manager.nextDate(ingredientList);
               customer.nextDate(ingredientList, now);
               manager.Settlement(ingredientList, now);
            }
            
         } else {
//               System.out.println("메뉴");
//               for (int i = 0; i < ingredientList.size(); i++) {
//                  Ingredient ingredient = ingredientList.get(i);
//                  System.out.printf("%s : %d\n", ingredient.getName(), ingredient.getSale());
//               }

            Customer customer = new Customer();
            System.out.println(buildDotMenu(ingredientList, 24));
            customer.customerMain(scan, ingredientList, now);
         }

         // 데이터 업로드
         try (BufferedWriter bw = new BufferedWriter(new FileWriter(filePath))) {
            for (Ingredient ingredient : ingredientList) {
               String str = ingredient.getName() + ";" + String.valueOf(ingredient.getStock()) + ";"
                     + String.valueOf(ingredient.getCost()) + ";" + String.valueOf(ingredient.getSale()) + ";"
                     + String.valueOf(ingredient.getCount()) + ";" + String.valueOf(ingredient.getSaleCount())
                     + ";" + String.valueOf(ingredient.getKind()) + "\n";
               bw.write(str);
            }
         } catch (IOException e) {
            System.err.println("파일 업로드 오류");
         }
      }

   }
   
   public static int getDisplayWidth(String text) {
      int width = 0;
      for (char c : text.toCharArray()) {
         if (c >= 0xAC00 && c <= 0xD7A3)
            width += 2; // 한글
         else
            width += 1; // 영문, 숫자
      }
      return width;
   }

   public String buildDotMenu(List<Ingredient> ingredients, int width) {
      StringBuilder sb = new StringBuilder();
      String border = "█";
      String dot = " ";

      // 상단 테두리
      sb.append(border.repeat(width - 6)).append("\n");

      // 상단 여백
      sb.append(border).append(dot.repeat(width - 13)).append(border).append("\n");

      // 재료들
      for (Ingredient item : ingredients) {
         if (item.getStock() > 0) {
            String line = String.format("%-4s", item.getName()) + ": " + String.format("%,4d", item.getSale()) + " ";
            sb.append(border).append(dot).append(line).append(dot).append(border).append("\n");
         }
      }

      // 하단 여백
      sb.append(border).append(dot.repeat(width - 13)).append(border).append("\n");

      // 하단 테두리
      sb.append(border.repeat(width - 6));

      return sb.toString().replace(' ', '\u3000');
   }
}